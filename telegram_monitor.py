#!/usr/bin/env python3
"""
Telegram Monitor for HALE Oracle
Listens for blockchain events and sends notifications to Telegram.
"""

import os
import time
import json
import requests
from web3 import Web3

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv('.env.local')
except ImportError:
    pass

# These would be in your .env file
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FACTORY_ADDRESS = os.getenv("FACTORY_CONTRACT_ADDRESS")
ARC_RPC_URL = os.getenv("ARC_RPC_URL", "https://rpc.testnet.arc.network")

def handle_event(event):
    """
    Handle ContractRequirementsSet event
    """
    try:
        # Extract data from the blockchain event
        args = event.get('args', {})
        seller = args.get('seller')
        requirements = args.get('requirements')
        contact_info = args.get('sellerContact') # The Telegram handle/ID

        if not contact_info or contact_info.lower() == 'no telegram':
            print(f"[Monitor] Skipping notification: No Telegram contact for {seller}")
            return

        # Construct the message
        msg = f"🚀 *New Escrow Requirements Set!*\n\n" \
              f"Seller: {seller}\n" \
              f"Requirements: {requirements}"

        print(f"[Monitor] Sending Telegram message to {contact_info}...")

        # Send to Telegram via HTTP POST
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        response = requests.post(url, json={
            "chat_id": contact_info, 
            "text": msg,
            "parse_mode": "Markdown"
        })
        
        if response.status_code == 200:
            print("[Monitor] ✅ Message sent successfully")
        else:
            print(f"[Monitor] ❌ Failed to send message: {response.text}")
            
    except Exception as e:
        print(f"[Monitor] Error handling event: {e}")

def main():
    print("🚀 Starting Telegram Monitor...")
    
    if not TELEGRAM_TOKEN:
        print("❌ Error: TELEGRAM_BOT_TOKEN not found in environment")
        return

    # Connect to Blockchain
    web3 = None
    while not web3 or not web3.is_connected():
        try:
            web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
            if web3.is_connected():
                print(f"✅ Connected to {ARC_RPC_URL}")
                break
            else:
                print("⚠️  Waiting for blockchain connection...")
                time.sleep(5)
        except Exception as e:
            print(f"⚠️  Connection error: {e}")
            time.sleep(5)

    # Load ABIs
    try:
        with open('escrow_abi.json', 'r') as f:
            escrow_abi = json.load(f)
        with open('frontend/src/factory_abi.json', 'r') as f:
            factory_abi = json.load(f)
    except FileNotFoundError as e:
        print(f"❌ Error loading ABIs: {e}")
        return

    # Initialize contracts
    if not FACTORY_ADDRESS:
        print("❌ Error: FACTORY_CONTRACT_ADDRESS not found")
        return
        
    factory_contract = web3.eth.contract(address=Web3.to_checksum_address(FACTORY_ADDRESS), abi=factory_abi)
    
    # Track escrows
    active_escrows = set()
    latest_block = web3.eth.block_number
    print(f"📡 Monitoring events from block {latest_block}...")

    while True:
        try:
            current_block = web3.eth.block_number
            
            # 1. Discover NEW escrows
            escrow_filter = {
                'fromBlock': latest_block,
                'toBlock': current_block,
                'address': Web3.to_checksum_address(FACTORY_ADDRESS),
                'topics': [web3.keccak(text='EscrowCreated(address,address,uint256)').hex()]
            }
            logs = web3.eth.get_logs(escrow_filter)
            
            for log in logs:
                escrow_address = Web3.to_checksum_address('0x' + log['topics'][1].hex()[-40:])
                active_escrows.add(escrow_address)
                print(f"[Monitor] Found escrow: {escrow_address}")

            # 2. Listen for Requirements on ALL active escrows
            if active_escrows:
                req_filter = {
                    'fromBlock': latest_block,
                    'toBlock': current_block,
                    'address': list(active_escrows),
                    'topics': [web3.keccak(text='ContractRequirementsSet(address,string,string)').hex()]
                }
                
                req_logs = web3.eth.get_logs(req_filter)
                
                for log in req_logs:
                    # Decode event
                    contract = web3.eth.contract(address=log['address'], abi=escrow_abi)
                    decoded_event = contract.events.ContractRequirementsSet().process_log(log)
                    
                    # Call the user's handler
                    handle_event(decoded_event)
            
            latest_block = current_block + 1
            time.sleep(5)
            
        except Exception as e:
            print(f"[Monitor] Error in loop: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
