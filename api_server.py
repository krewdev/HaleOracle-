#!/usr/bin/env python3
"""
HALE Oracle API Server
Provides REST API for delivery submissions and runs Oracle verification daemon
"""

import os
import json
import random
import string
import time
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
from hale_oracle_backend import HaleOracle
import requests
import hashlib
import hmac

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv('.env.local')
except:
    pass

# Base dir for ABIs (so daemon/API work regardless of CWD)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)

# Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
ARC_RPC_URL = os.getenv('ARC_RPC_URL', 'https://rpc.testnet.arc.network')
FACTORY_ADDRESS = os.getenv('FACTORY_CONTRACT_ADDRESS')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')  # For sending OTPs
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:3002')  # Frontend URL for submission links

# In-memory storage (use Redis/DB in production)
# Keyed by seller address to match deployed escrow contract (deposit(seller), setContractRequirements(seller, ...))
otp_store = {}  # {seller_address: {otp: str, timestamp: int, escrow_address: str, requirements: str}}
pending_deliveries = {}  # {seller_address: {code: str, escrow_address: str, timestamp: int}}
verdict_store = {}  # {seller_address: {verdict: str, confidence: int, reasoning: str, timestamp: int}}
telegram_users = {}  # {username: chat_id} - populated when users /start the bot

# Initialize Oracle
oracle = HaleOracle(GEMINI_API_KEY, ARC_RPC_URL)

# Load existing Telegram user mappings from file (if exists)
TELEGRAM_USERS_FILE = 'telegram_users.json'
try:
    if os.path.exists(TELEGRAM_USERS_FILE):
        with open(TELEGRAM_USERS_FILE, 'r') as f:
            telegram_users = json.load(f)
            print(f"[Telegram] Loaded {len(telegram_users)} user mappings")
except Exception as e:
    print(f"[Telegram] Could not load user mappings: {e}")

def save_telegram_users():
    """Save telegram user mappings to file"""
    try:
        with open(TELEGRAM_USERS_FILE, 'w') as f:
            json.dump(telegram_users, f, indent=2)
    except Exception as e:
        print(f"[Telegram] Error saving user mappings: {e}")

def generate_otp():
    """Generate 5-digit OTP"""
    return ''.join(random.choices(string.digits, k=5))

def send_telegram_message(telegram_username, message):
    """
    Send message via Telegram Bot API
    
    Supports:
    - Telegram username (e.g., "john_doe" or "@john_doe")
    - Chat ID (numeric)
    
    Username resolution requires the user to have started a chat with the bot first.
    """
    if not TELEGRAM_BOT_TOKEN:
        print(f"[Telegram] ⚠️  No TELEGRAM_BOT_TOKEN configured")
        print(f"[Telegram] Would send to {telegram_username}:")
        print(f"[Telegram] {message}")
        print(f"[Telegram] To enable: Set TELEGRAM_BOT_TOKEN in .env")
        return False
    
    try:
        # Normalize username (remove @ if present)
        username = telegram_username.strip()
        if username.startswith('@'):
            username = username[1:]
        
        # Try to resolve username to chat_id
        chat_id = None
        
        # Check if it's already a numeric chat_id
        if username.isdigit():
            chat_id = username
        else:
            # Look up username in our mapping
            chat_id = telegram_users.get(username.lower())
            
            if not chat_id:
                print(f"[Telegram] ⚠️  Username '{username}' not found in database")
                print(f"[Telegram] User must start a chat with the bot first")
                print(f"[Telegram] Send them this link: https://t.me/{TELEGRAM_BOT_TOKEN.split(':')[0]}")
                print(f"[Telegram] Message would be: {message}")
                return False
        
        # Send message via Telegram Bot API
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'Markdown'
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        if result.get('ok'):
            print(f"[Telegram] ✅ Message sent to {telegram_username} (chat_id: {chat_id})")
            return True
        else:
            print(f"[Telegram] ❌ Failed: {result.get('description')}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[Telegram] ❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"[Telegram] ❌ Error: {e}")
        return False

def listen_for_events():
    """Background daemon to listen for blockchain events"""
    print("[Daemon] Starting event listener...")
    
    if not FACTORY_ADDRESS:
        print("[Daemon] ERROR: FACTORY_CONTRACT_ADDRESS not set in .env. OTP daemon will not run.")
        return
    if not oracle.web3 or not oracle.web3.is_connected():
        print("[Daemon] Warning: No blockchain connection. Retrying...")
        time.sleep(5)
        return
    
    factory_abi_path = os.path.join(BASE_DIR, 'frontend', 'src', 'factory_abi.json')
    escrow_abi_path = os.path.join(BASE_DIR, 'escrow_abi.json')
    try:
        with open(factory_abi_path, 'r') as f:
            factory_abi = json.load(f)
    except Exception as e:
        print(f"[Daemon] Could not load factory ABI from {factory_abi_path}: {e}")
        return
    try:
        with open(escrow_abi_path, 'r') as f:
            escrow_abi = json.load(f)
    except Exception as e:
        print(f"[Daemon] Could not load escrow ABI from {escrow_abi_path}: {e}")
        return
    
    factory_contract = oracle.web3.eth.contract(
        address=Web3.to_checksum_address(FACTORY_ADDRESS),
        abi=factory_abi
    )
    
    # Track active escrows
    active_escrows = set()
    
    latest_block = oracle.web3.eth.block_number
    print(f"[Daemon] Monitoring from block {latest_block}")
    
    while True:
        try:
            current_block = oracle.web3.eth.block_number
            
            # 1. Listen for NEW escrow creations from Factory
            escrow_created_filter = {
                'fromBlock': latest_block,
                'toBlock': current_block,
                'address': Web3.to_checksum_address(FACTORY_ADDRESS),
                'topics': [oracle.web3.keccak(text='EscrowCreated(address,address,uint256)').hex()]
            }
            
            escrow_logs = oracle.web3.eth.get_logs(escrow_created_filter)
            
            for log in escrow_logs:
                # Decode escrow address from topics[1]
                escrow_address = Web3.to_checksum_address('0x' + log['topics'][1].hex()[-40:])
                owner = Web3.to_checksum_address('0x' + log['topics'][2].hex()[-40:])
                
                active_escrows.add(escrow_address)
                print(f"[Daemon] 🆕 New escrow created: {escrow_address} (owner: {owner})")
            
            # 2. Listen for ContractRequirementsSet on ALL active escrows
            if active_escrows:
                requirements_filter = {
                    'fromBlock': latest_block,
                    'toBlock': current_block,
                    'address': list(active_escrows),
                    'topics': [oracle.web3.keccak(text='ContractRequirementsSet(address,string,string)').hex()]
                }
                
                req_logs = oracle.web3.eth.get_logs(requirements_filter)
                
                for log in req_logs:
                    escrow_address = log['address']
                    seller = Web3.to_checksum_address('0x' + log['topics'][1].hex()[-40:])
                    
                    # Decode the event data to get requirements and contact
                    contract = oracle.web3.eth.contract(address=escrow_address, abi=escrow_abi)
                    decoded = contract.events.ContractRequirementsSet().process_log(log)
                    
                    requirements = decoded['args']['requirements']
                    seller_contact = decoded['args']['sellerContact']
                    
                    print(f"[Daemon] 📋 Requirements set for seller {seller} in escrow {escrow_address}")
                    print(f"[Daemon] Requirements: {requirements[:100]}...")
                    
                    # Generate OTP (keyed by seller address – matches deployed contract)
                    otp = generate_otp()
                    otp_store[seller.lower()] = {
                        'otp': otp,
                        'timestamp': int(time.time()),
                        'escrow_address': escrow_address,
                        'requirements': requirements,
                        'seller_address': seller
                    }
                    
                    submission_link = f"{FRONTEND_BASE_URL}/submit?escrow={escrow_address}&seller={seller}&otp={otp}"
                    
                    # Check if seller contact was provided (Telegram)
                    if seller_contact and seller_contact.strip() and seller_contact.lower() != 'no telegram':
                        send_telegram_message(
                            seller_contact,
                            f"🔐 HALE Oracle Delivery Request\n\n"
                            f"Escrow: {escrow_address}\n"
                            f"Your OTP: {otp}\n\n"
                            f"Submit at: {submission_link}"
                        )
                        print(f"[Daemon] ✅ OTP {otp} sent to {seller_contact}")
                    else:
                        print(f"[Daemon] 🔗 Shareable link: {submission_link}")
                        print(f"[Daemon] 🔐 OTP: {otp}")
            
            # 3. Listen for DeliverySubmitted events
            if active_escrows:
                delivery_filter = {
                    'fromBlock': latest_block,
                    'toBlock': current_block,
                    'address': list(active_escrows),
                    'topics': [oracle.web3.keccak(text='DeliverySubmitted(address,string,uint256)').hex()]
                }
                
                delivery_logs = oracle.web3.eth.get_logs(delivery_filter)
                
                for log in delivery_logs:
                    seller = Web3.to_checksum_address('0x' + log['topics'][1].hex()[-40:])
                    print(f"[Daemon] 📦 Delivery submitted by {seller} (on-chain)")
            
            latest_block = current_block + 1
            time.sleep(10)  # Poll every 10 seconds
            
        except Exception as e:
            print(f"[Daemon] Error: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(10)

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'oracle_connected': oracle.web3 is not None and oracle.web3.is_connected(),
        'gemini_mode': 'mock' if oracle.mock_mode else 'live',
        'telegram_users': len(telegram_users)
    })

@app.route('/api/generate-otp', methods=['POST'])
def generate_otp_endpoint():
    """
    Generate OTP for a seller and optionally notify via Telegram.
    Used when requirements are set on-chain.
    
    Body:
    {
        "seller_address": "0x...",
        "escrow_address": "0x...",
        "requirements": "...",
        "seller_telegram": "@username"  (optional)
    }
    """
    data = request.json or {}
    seller_address = data.get('seller_address', '').lower().strip()
    escrow_address = data.get('escrow_address', '').strip()
    requirements = data.get('requirements', '')
    seller_telegram = data.get('seller_telegram', '')
    
    if not seller_address or not escrow_address:
        return jsonify({'error': 'seller_address and escrow_address required'}), 400
    
    otp = generate_otp()
    otp_data = {
        'otp': otp,
        'timestamp': int(time.time()),
        'escrow_address': escrow_address,
        'seller_address': seller_address,
        'requirements': requirements,
        'seller_telegram': seller_telegram
    }
    otp_store[seller_address] = otp_data
    
    submission_link = f"{FRONTEND_BASE_URL}/submit?escrow={escrow_address}&seller={seller_address}&otp={otp}"
    
    # Send Telegram notification if configured
    if seller_telegram and TELEGRAM_BOT_TOKEN:
        message = f"""🔔 New HALE Escrow Notification!

📋 Requirements: {requirements[:200]}...

🔑 Your OTP: {otp}

📎 Submit your code:
{submission_link}"""
        send_telegram_message(seller_telegram, message)
    
    return jsonify({
        'otp': otp,
        'escrow_address': escrow_address,
        'seller_address': seller_address,
        'submission_link': submission_link,
        'expires_at': otp_data['timestamp'] + 600
    })

@app.route('/api/escrow-status/<escrow_address>', methods=['GET'])
def escrow_status(escrow_address):
    """
    Get the status of an escrow including Oracle verdict if available.
    """
    escrow_address = escrow_address.strip()
    
    # Check pending deliveries
    for seller, delivery in pending_deliveries.items():
        if delivery.get('escrow_address', '').lower() == escrow_address.lower():
            return jsonify({
                'status': 'pending_verification',
                'seller': seller,
                'submitted_at': delivery.get('timestamp')
            })
    
    # Check if we have OTP data (requirements set but no delivery yet)
    for seller, otp_data in otp_store.items():
        if otp_data.get('escrow_address', '').lower() == escrow_address.lower():
            return jsonify({
                'status': 'awaiting_delivery',
                'seller': seller,
                'requirements': otp_data.get('requirements', '')[:200]
            })
    
    return jsonify({
        'status': 'unknown',
        'message': 'Escrow not found in active tracking'
    })


@app.route('/api/telegram/webhook', methods=['POST'])
def telegram_webhook():
    """
    Telegram Bot webhook to capture user registrations
    
    When a user sends /start to the bot, we capture their username and chat_id
    Set this webhook URL in Telegram: 
    https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook
    """
    try:
        update = request.json
        
        # Extract message data
        message = update.get('message', {})
        chat = message.get('chat', {})
        text = message.get('text', '')
        
        chat_id = chat.get('id')
        username = chat.get('username', '').lower()
        first_name = chat.get('first_name', '')
        
        if not chat_id:
            return jsonify({'ok': True})
        
        # Handle /start command
        if text.startswith('/start'):
            if username:
                telegram_users[username] = str(chat_id)
                save_telegram_users()
                print(f"[Telegram] ✅ Registered user: @{username} -> {chat_id}")
                
                # Send welcome message
                welcome_msg = (
                    f"👋 Welcome to HALE Oracle, {first_name}!\n\n"
                    f"Your account is now registered.\n"
                    f"Username: @{username}\n"
                    f"Chat ID: {chat_id}\n\n"
                    f"You can now receive delivery notifications!"
                )
                send_telegram_message(str(chat_id), welcome_msg)
            else:
                # User doesn't have a username
                print(f"[Telegram] ⚠️  User {chat_id} has no username")
                no_username_msg = (
                    f"⚠️ You don't have a Telegram username set.\n\n"
                    f"Please set a username in Telegram Settings, then send /start again.\n\n"
                    f"Alternatively, share your Chat ID: `{chat_id}`"
                )
                send_telegram_message(str(chat_id), no_username_msg)
        
        return jsonify({'ok': True})
        
    except Exception as e:
        print(f"[Telegram] Webhook error: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/telegram/users', methods=['GET'])
def list_telegram_users():
    """List registered Telegram users"""
    return jsonify({
        'count': len(telegram_users),
        'users': [{'username': k, 'chat_id': v} for k, v in telegram_users.items()]
    })

def _fetch_otp_from_tx(tx_hash, seller_address, escrow_address):
    """
    Generate OTP from the setContractRequirements transaction receipt (most reliable).
    Uses the exact tx that emitted ContractRequirementsSet.
    """
    if not oracle.web3 or not oracle.web3.is_connected():
        print("[API] OTP from tx: no chain connection")
        return None
    seller_normalized = seller_address.lower().strip()
    tx_hash = tx_hash.strip()
    if not tx_hash.startswith('0x'):
        tx_hash = '0x' + tx_hash
    try:
        receipt = oracle.web3.eth.get_transaction_receipt(tx_hash)
    except Exception as e:
        print(f"[API] OTP from tx: get_receipt error: {e}")
        return None
    if not receipt or not receipt.get('logs'):
        print(f"[API] OTP from tx: no logs in receipt for {tx_hash[:10]}...")
        return None
    event_sig = oracle.web3.keccak(text='ContractRequirementsSet(address,string,string)').hex()
    escrow_abi_path = os.path.join(BASE_DIR, 'escrow_abi.json')
    try:
        with open(escrow_abi_path, 'r') as f:
            escrow_abi = json.load(f)
    except Exception as e:
        print(f"[API] OTP from tx: could not load escrow_abi: {e}")
        return None
    for log in receipt['logs']:
        if len(log.get('topics', [])) < 2:
            continue
        if log['topics'][0].hex() != event_sig:
            continue
        if escrow_address and log['address'].lower() != escrow_address.lower():
            continue
        try:
            contract = oracle.web3.eth.contract(address=log['address'], abi=escrow_abi)
            decoded = contract.events.ContractRequirementsSet().process_log(log)
            event_seller = (decoded['args'].get('seller') or '').lower()
            if event_seller != seller_normalized:
                continue
            requirements = decoded['args']['requirements']
            seller_contact = decoded['args'].get('sellerContact', '') or 'No Telegram'
            otp = generate_otp()
            seller_checksum = Web3.to_checksum_address(seller_normalized)
            otp_store[seller_normalized] = {
                'otp': otp,
                'timestamp': int(time.time()),
                'escrow_address': log['address'],
                'requirements': requirements,
                'seller_address': seller_checksum
            }
            submission_link = f"{FRONTEND_BASE_URL}/submit?escrow={log['address']}&seller={seller_checksum}&otp={otp}"
            print(f"[API] OTP from tx: generated for {seller_normalized} (tx {tx_hash[:10]}...)")
            if seller_contact and seller_contact.strip() and seller_contact.lower() != 'no telegram':
                send_telegram_message(
                    seller_contact,
                    f"🔐 HALE Oracle Delivery Request\n\n"
                    f"Escrow: {log['address']}\n"
                    f"Your OTP: {otp}\n\n"
                    f"Submit at: {submission_link}"
                )
                print(f"[API] OTP from tx: sent to Telegram: {seller_contact}")
            return otp_store[seller_normalized]
        except Exception as e:
            print(f"[API] OTP from tx decode error: {e}")
            continue
    print(f"[API] OTP from tx: no ContractRequirementsSet in receipt for {tx_hash[:10]}...")
    return None


def _fetch_otp_from_chain(escrow_address, seller_address):
    """
    One-off scan for ContractRequirementsSet on escrow; if found, generate OTP, store, and send Telegram.
    Used when daemon hasn't seen the event yet (e.g. polling right after setContractRequirements).
    """
    if not oracle.web3 or not oracle.web3.is_connected():
        print("[API] Fallback OTP: no chain connection")
        return None
    seller_normalized = seller_address.lower().strip()
    if seller_normalized.startswith('0x') and len(seller_normalized) != 42:
        print(f"[API] Fallback OTP: invalid seller address length {len(seller_normalized)}")
        return None
    escrow_abi_path = os.path.join(BASE_DIR, 'escrow_abi.json')
    try:
        with open(escrow_abi_path, 'r') as f:
            escrow_abi = json.load(f)
    except Exception as e:
        print(f"[API] Fallback OTP: could not load escrow_abi from {escrow_abi_path}: {e}")
        return None
    event_sig = oracle.web3.keccak(text='ContractRequirementsSet(address,string,string)').hex()
    current = oracle.web3.eth.block_number
    from_block = max(0, current - 1000)
    try:
        logs = oracle.web3.eth.get_logs({
            'fromBlock': from_block,
            'toBlock': current,
            'address': Web3.to_checksum_address(escrow_address),
            'topics': [event_sig]
        })
    except Exception as e:
        print(f"[API] Fallback OTP get_logs error: {e}")
        return None
    contract = oracle.web3.eth.contract(address=Web3.to_checksum_address(escrow_address), abi=escrow_abi)
    for log in reversed(logs):
        try:
            decoded = contract.events.ContractRequirementsSet().process_log(log)
            event_seller = decoded['args']['seller']
            if event_seller and event_seller.lower() == seller_normalized:
                requirements = decoded['args']['requirements']
                seller_contact = decoded['args'].get('sellerContact', '') or 'No Telegram'
                otp = generate_otp()
                seller_checksum = Web3.to_checksum_address(seller_normalized)
                otp_store[seller_normalized] = {
                    'otp': otp,
                    'timestamp': int(time.time()),
                    'escrow_address': escrow_address,
                    'requirements': requirements,
                    'seller_address': seller_checksum
                }
                submission_link = f"{FRONTEND_BASE_URL}/submit?escrow={escrow_address}&seller={seller_checksum}&otp={otp}"
                print(f"[API] Fallback OTP generated for {seller_normalized} (escrow {escrow_address})")
                if seller_contact and seller_contact.strip() and seller_contact.lower() != 'no telegram':
                    send_telegram_message(
                        seller_contact,
                        f"🔐 HALE Oracle Delivery Request\n\n"
                        f"Escrow: {escrow_address}\n"
                        f"Your OTP: {otp}\n\n"
                        f"Submit at: {submission_link}"
                    )
                    print(f"[API] Fallback OTP sent to Telegram: {seller_contact}")
                return otp_store[seller_normalized]
        except Exception as e:
            print(f"[API] Fallback OTP decode log error: {e}")
            continue
    print(f"[API] Fallback OTP: no ContractRequirementsSet found for seller {seller_normalized} on escrow {escrow_address} (blocks {from_block}-{current})")
    return None


@app.route('/api/get-submission-link/<seller_address>', methods=['GET'])
def get_submission_link(seller_address):
    """
    Get submission link for a seller (for buyer to share manually).
    Keyed by seller wallet address to match deployed escrow.
    Query params:
      escrow=<address> — if OTP not in store, scan chain (or use tx_hash) to generate OTP.
      tx_hash=<hash>   — use this setContractRequirements tx receipt to generate OTP (most reliable).
    """
    seller_address = seller_address.lower().strip()
    escrow_param = request.args.get('escrow', '').strip()
    tx_hash_param = request.args.get('tx_hash', '').strip()
    otp_data = otp_store.get(seller_address)
    if not otp_data and oracle.web3 and oracle.web3.is_connected():
        if tx_hash_param and escrow_param:
            print(f"[API] get-submission-link: no OTP in store, trying tx_hash fallback (tx={tx_hash_param[:10]}...)")
            otp_data = _fetch_otp_from_tx(tx_hash_param, seller_address, escrow_param)
        if not otp_data and escrow_param:
            print(f"[API] get-submission-link: trying chain fallback (escrow={escrow_param[:10]}..., seller={seller_address[:10]}...)")
            otp_data = _fetch_otp_from_chain(escrow_param, seller_address)
    if not otp_data:
        print(f"[API] get-submission-link: 404 for seller {seller_address[:10]}... (escrow param: {bool(escrow_param)})")
        return jsonify({'error': 'No OTP found for this seller'}), 404
    
    submission_link = f"{FRONTEND_BASE_URL}/submit?escrow={otp_data['escrow_address']}&seller={otp_data['seller_address']}&otp={otp_data['otp']}"
    
    return jsonify({
        'seller_address': otp_data['seller_address'],
        'escrow_address': otp_data['escrow_address'],
        'otp': otp_data['otp'],
        'submission_link': submission_link,
        'expires_at': otp_data['timestamp'] + 600
    })

@app.route('/api/submit-delivery', methods=['POST'])
def submit_delivery():
    """
    Seller submits delivery with OTP.
    Body: { "seller_address": "0x...", "otp": "12345", "code": "..." }
    Optional: "escrow_address" for validation; backend gets it from otp_store.
    """
    data = request.json
    seller_address = data.get('seller_address', '').lower()
    otp = data.get('otp', '')
    code = data.get('code', '')
    
    if not seller_address or not otp or not code:
        return jsonify({'error': 'Missing required fields'}), 400
    
    stored_otp_data = otp_store.get(seller_address)
    if not stored_otp_data:
        return jsonify({'error': 'No OTP found for this address'}), 404
    
    if stored_otp_data['otp'] != otp:
        return jsonify({'error': 'Invalid OTP'}), 401
    
    if int(time.time()) - stored_otp_data['timestamp'] > 600:
        return jsonify({'error': 'OTP expired'}), 401
    
    escrow_address = stored_otp_data['escrow_address']
    
    pending_deliveries[seller_address] = {
        'code': code,
        'escrow_address': escrow_address,
        'timestamp': int(time.time())
    }
    
    threading.Thread(target=process_delivery, args=(seller_address,)).start()
    
    return jsonify({
        'status': 'submitted',
        'message': 'Delivery submitted for verification'
    })

def process_delivery(seller_address):
    """Process delivery through Oracle"""
    try:
        delivery_data = pending_deliveries.get(seller_address)
        if not delivery_data:
            return
        
        # Get contract requirements from blockchain
        escrow_address = delivery_data['escrow_address']
        # Get requirements from store (preserved from OTP generation)
        requirements = "Standard code delivery"
        if seller_address in otp_store:
             requirements = otp_store[seller_address].get('requirements', requirements)

        # Build contract_data for Oracle
        contract_data = {
            'transaction_id': f"delivery_{seller_address}_{int(time.time())}",
            'Contract_Terms': f"Project Requirements: {requirements}",
            'Acceptance_Criteria': [
                "Code must compile without errors",
                f"Code must fulfill: {requirements}",
                "Code must pass security audit"
            ],
            'Delivery_Content': delivery_data['code'],
            'escrow_address': escrow_address
        }
        
        # Run Oracle verification
        result = oracle.process_delivery(contract_data, seller_address)
        
        print(f"[Oracle] Verification complete for {seller_address}")
        print(f"[Oracle] Verdict: {result.get('verdict')}")
        print(f"[Oracle] Confidence: {result.get('confidence_score')}%")
        
        # Store verdict for frontend polling
        verdict_store[seller_address] = {
            'verdict': result.get('verdict'),
            'confidence': result.get('confidence_score'),
            'reasoning': result.get('reasoning', ''),
            'risk_flags': result.get('risk_flags', []),
            'timestamp': int(time.time()),
            'escrow_address': escrow_address
        }
        
        # Send verdict to seller via Telegram
        seller_telegram = otp_store.get(seller_address, {}).get('seller_telegram', '')
        if seller_telegram:
            verdict = result.get('verdict', 'UNKNOWN')
            confidence = result.get('confidence_score', 0)
            reasoning = result.get('reasoning', 'No details available')[:500]
            
            if verdict == 'PASS':
                emoji = "✅"
                action = "Funds will be released to your wallet!"
            else:
                emoji = "❌"
                action = "Funds will be refunded to buyer."
            
            verdict_message = f"""{emoji} HALE Oracle Verdict: {verdict}

📊 Confidence: {confidence}%

📝 Analysis:
{reasoning}

💰 {action}

🔗 Escrow: {escrow_address[:20]}..."""
            
            send_telegram_message(seller_telegram, verdict_message)
        
        # Auto-release if confidence >= 90%
        if result.get('confidence_score', 0) >= 90 and result.get('verdict') == 'PASS':
            print(f"[Oracle] Auto-releasing funds (confidence: {result.get('confidence_score')}%)")

            
    except Exception as e:
        print(f"[Oracle] Error processing delivery: {e}")
        # Store failure verdict so frontend knows it failed
        verdict_store[seller_address] = {
            'verdict': 'ERROR',
            'confidence': 0,
            'reasoning': f"Internal Error: {str(e)}",
            'risk_flags': ['System Error'],
            'timestamp': int(time.time())
        }
    finally:
        # Clean up pending (ensure we don't get stuck in 'processing')
        if seller_address in pending_deliveries:
            del pending_deliveries[seller_address]
        if seller_address in otp_store:
            del otp_store[seller_address]

def verify_telegram_auth(data):
    """
    Verify Telegram Login Widget data.
    """
    if not TELEGRAM_BOT_TOKEN:
        print("[Telegram Auth] No TELEGRAM_BOT_TOKEN provided")
        return False
        
    received_hash = data.get('hash')
    if not received_hash:
        print("[Telegram Auth] No hash provided")
        return False
        
    # Data-check-string is a concatenation of all received fields, sorted in alphabetical order
    # in the format key=<value> with a line feed character ('\n', 0x0A) used as separator
    data_check_list = []
    for key in sorted(data.keys()):
        if key != 'hash':
            value = str(data[key])
            data_check_list.append(f"{key}={value}")
    
    data_check_string = '\n'.join(data_check_list)
    
    # Secret key is SHA256 hash of the bot token
    secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).digest()
    
    # Calculate HMAC
    hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    return hmac_hash == received_hash

@app.route('/api/telegram/verify_login', methods=['POST'])
def telegram_verify_login():
    """Verify data from Telegram Login Widget"""
    try:
        data = request.json
        if not data:
            return jsonify({'ok': False, 'error': 'No data provided'}), 400
            
        is_valid = verify_telegram_auth(data)
        
        if is_valid:
            # Check auth_date for freshness (e.g. 24 hours)
            auth_date = int(data.get('auth_date', 0))
            if time.time() - auth_date > 86400:
                print(f"[Telegram Auth] Data expired. auth_date: {auth_date}")
                return jsonify({'ok': False, 'error': 'Data is outdated'}), 401
                
            user = {
                'id': data.get('id'),
                'username': data.get('username'),
                'first_name': data.get('first_name'),
                'photo_url': data.get('photo_url')
            }
            
            # Update our user mapping if applicable
            if user['username']:
                telegram_users[user['username'].lower()] = str(user['id'])
                save_telegram_users()
                
            return jsonify({'ok': True, 'user': user})
        else:
            print("[Telegram Auth] Verification failed")
            return jsonify({'ok': False, 'error': 'Invalid hash'}), 401
    except Exception as e:
        print(f"[Telegram Auth] Error: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/telegram/bot_info', methods=['GET'])
def get_bot_info():
    """Get bot username for frontend widget"""
    if not TELEGRAM_BOT_TOKEN:
         return jsonify({'error': 'TELEGRAM_BOT_TOKEN not set'}), 500
    
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
        response = requests.get(url, timeout=5)
        if response.ok:
             data = response.json()
             if data.get('ok'):
                 return jsonify({'username': data['result']['username']})
        return jsonify({'username': 'HaleOracleBot'}), 200 # Fallback or error
    except Exception as e:
        print(f"[Telegram] Error fetching bot info: {e}")
        return jsonify({'username': 'HaleOracleBot'}), 200


@app.route('/api/delivery-status/<seller_address>', methods=['GET'])
def delivery_status(seller_address):
    """Check delivery status"""
    seller_address = seller_address.lower()
    
    if seller_address in pending_deliveries:
        return jsonify({'status': 'processing'})
    
    # Check blockchain for release/refund events
    return jsonify({'status': 'unknown'})

if __name__ == '__main__':
    # Start event listener in background
    listener_thread = threading.Thread(target=listen_for_events, daemon=True)
    listener_thread.start()
    
    # Start Flask server
    print("[API Server] Starting on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
