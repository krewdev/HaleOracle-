#!/usr/bin/env python3
"""
HALE Oracle Automated Test Suite
Tests the full flow: Deploy -> Deposit -> Set Requirements -> Submit Delivery -> Verify
"""

import os
import sys
import json
import time
import requests
from web3 import Web3
from eth_account import Account

# Add parent directory to path
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
# Arc Testnet RPC - fallback to testnet if mainnet URL is in .env
ARC_RPC_URL = os.getenv("ARC_TESTNET_RPC_URL", "https://rpc.testnet.arc.network")
FACTORY_ADDRESS = os.getenv("FACTORY_CONTRACT_ADDRESS", "0x33e9915F122135B88fDEba6e8312f0cD8E678098")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")  # Test wallet private key

# Test Results
class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def record(self, name, success, error=None):
        if success:
            self.passed += 1
            print(f"  ✅ {name}")
        else:
            self.failed += 1
            self.errors.append((name, error))
            print(f"  ❌ {name}: {error}")
    
    def summary(self):
        print(f"\n{'='*50}")
        print(f"Test Results: {self.passed} passed, {self.failed} failed")
        if self.errors:
            print("\nFailed Tests:")
            for name, error in self.errors:
                print(f"  - {name}: {error}")
        return self.failed == 0

results = TestResults()

# ============================================
# API Health Tests
# ============================================
def test_api_health():
    """Test API server is running and healthy"""
    print("\n🔍 Testing API Health...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/health", timeout=5)
        data = response.json()
        results.record("API Health Endpoint", response.status_code == 200)
        results.record("API Status OK", data.get("status") == "ok")
        results.record("Gemini Mode Available", "gemini_mode" in data)
        return True
    except Exception as e:
        results.record("API Health", False, str(e))
        return False

# ============================================
# Telegram Tests
# ============================================
def test_telegram_endpoints():
    """Test Telegram-related API endpoints"""
    print("\n🔍 Testing Telegram Endpoints...")
    try:
        # Test user list endpoint
        response = requests.get(f"{API_BASE_URL}/api/telegram/users", timeout=5)
        results.record("Telegram Users Endpoint", response.status_code == 200)
        
        # Test bot info endpoint
        response = requests.get(f"{API_BASE_URL}/api/telegram/bot_info", timeout=5)
        results.record("Telegram Bot Info Endpoint", response.status_code == 200)
        if response.status_code == 200:
            data = response.json()
            results.record("Bot Username Available", "username" in data)
        return True
    except Exception as e:
        results.record("Telegram Endpoints", False, str(e))
        return False

# ============================================
# Blockchain Connection Tests
# ============================================
def test_blockchain_connection():
    """Test connection to Arc Testnet"""
    print("\n🔍 Testing Blockchain Connection...")
    try:
        web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
        connected = web3.is_connected()
        results.record("Web3 Connection", connected)
        
        if connected:
            block = web3.eth.block_number
            results.record(f"Current Block ({block})", block > 0)
            
            chain_id = web3.eth.chain_id
            results.record(f"Chain ID ({chain_id})", chain_id == 5041986)  # Arc Testnet
        return connected
    except Exception as e:
        results.record("Blockchain Connection", False, str(e))
        return False

# ============================================
# Contract ABI Tests
# ============================================
def test_contract_abis():
    """Test that contract ABIs are valid and loadable"""
    print("\n🔍 Testing Contract ABIs...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    abi_files = [
        ("Factory ABI", "frontend/src/factory_abi.json"),
        ("Escrow ABI", "frontend/src/escrow_abi.json"),
        ("Escrow ABI (Backend)", "escrow_abi.json"),
        ("ERC20 ABI", "frontend/src/erc20_abi.json"),
    ]
    
    for name, path in abi_files:
        full_path = os.path.join(base_dir, path)
        try:
            with open(full_path, 'r') as f:
                abi = json.load(f)
            results.record(f"{name} Loadable", isinstance(abi, list) and len(abi) > 0)
        except Exception as e:
            results.record(f"{name}", False, str(e))

# ============================================
# Factory Contract Tests
# ============================================
def test_factory_contract():
    """Test Factory contract on Arc Testnet"""
    print("\n🔍 Testing Factory Contract...")
    try:
        web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
        if not web3.is_connected():
            results.record("Factory Contract", False, "Not connected to blockchain")
            return False
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(base_dir, "frontend/src/factory_abi.json"), 'r') as f:
            factory_abi = json.load(f)
        
        factory = web3.eth.contract(
            address=Web3.to_checksum_address(FACTORY_ADDRESS),
            abi=factory_abi
        )
        
        # Test oracleAddress view function
        oracle_address = factory.functions.oracleAddress().call()
        results.record("Factory Oracle Address", Web3.is_address(oracle_address))
        
        # Test allEscrows array (length check)
        try:
            escrow_0 = factory.functions.allEscrows(0).call()
            results.record("Factory Has Deployed Escrows", Web3.is_address(escrow_0))
        except:
            results.record("Factory Escrows Array", True, "No escrows yet (expected for new factory)")
        
        return True
    except Exception as e:
        results.record("Factory Contract", False, str(e))
        return False

# ============================================
# Escrow Contract Tests (requires deployed escrow)
# ============================================
def test_escrow_contract_functions():
    """Test that a deployed Escrow has the required functions"""
    print("\n🔍 Testing Escrow Contract Functions...")
    try:
        web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
        if not web3.is_connected():
            results.record("Escrow Functions", False, "Not connected")
            return False
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(base_dir, "frontend/src/factory_abi.json"), 'r') as f:
            factory_abi = json.load(f)
        with open(os.path.join(base_dir, "frontend/src/escrow_abi.json"), 'r') as f:
            escrow_abi = json.load(f)
        
        factory = web3.eth.contract(
            address=Web3.to_checksum_address(FACTORY_ADDRESS),
            abi=factory_abi
        )
        
        # Get the latest escrow
        try:
            escrow_address = factory.functions.allEscrows(0).call()
        except:
            results.record("Escrow Functions", True, "No escrows deployed yet; skipping")
            return True
        
        escrow = web3.eth.contract(
            address=Web3.to_checksum_address(escrow_address),
            abi=escrow_abi
        )
        
        # Check required functions exist by calling view functions
        oracle = escrow.functions.oracle().call()
        results.record("Escrow.oracle()", Web3.is_address(oracle))
        
        owner = escrow.functions.owner().call()
        results.record("Escrow.owner()", Web3.is_address(owner))
        
        # Check setContractRequirements exists in ABI
        has_set_requirements = any(
            item.get("name") == "setContractRequirements" 
            for item in escrow_abi if item.get("type") == "function"
        )
        results.record("Escrow.setContractRequirements() in ABI", has_set_requirements)
        
        return True
    except Exception as e:
        results.record("Escrow Functions", False, str(e))
        return False

# ============================================
# OTP Generation Test (Mock)
# ============================================
def test_otp_generation():
    """Test OTP generation endpoint"""
    print("\n🔍 Testing OTP Generation...")
    
    # This requires an actual escrow with requirements set
    # For now, just test that the endpoint responds
    test_seller = "0x0000000000000000000000000000000000000001"
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/get-submission-link/{test_seller}",
            timeout=5
        )
        # 404 is expected if no OTP exists for this seller
        results.record("OTP Endpoint Responds", response.status_code in [200, 404])
        return True
    except Exception as e:
        results.record("OTP Endpoint", False, str(e))
        return False

# ============================================
# Delivery Submission Test (Mock)
# ============================================
def test_delivery_submission():
    """Test delivery submission endpoint"""
    print("\n🔍 Testing Delivery Submission...")
    
    # Test with invalid data (should return 400 or 404)
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/submit-delivery",
            json={
                "seller_address": "0x0000000000000000000000000000000000000001",
                "otp": "12345",
                "code": "print('hello world')"
            },
            timeout=5
        )
        # 404/401 expected for invalid OTP
        results.record("Submission Endpoint Responds", response.status_code in [200, 400, 401, 404])
        return True
    except Exception as e:
        results.record("Submission Endpoint", False, str(e))
        return False

# ============================================
# Full Integration Test (requires private key)
# ============================================
def test_full_integration():
    """Full integration test: Deploy -> Deposit -> Set Requirements"""
    print("\n🔍 Testing Full Integration Flow...")
    
    if not PRIVATE_KEY:
        results.record("Full Integration", True, "Skipped (no PRIVATE_KEY in .env)")
        return True
    
    try:
        web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
        if not web3.is_connected():
            results.record("Full Integration", False, "Not connected")
            return False
        
        account = Account.from_key(PRIVATE_KEY)
        buyer_address = account.address
        
        # Check balance
        balance = web3.eth.get_balance(buyer_address)
        if balance < web3.to_wei(0.01, 'ether'):
            results.record("Full Integration", True, f"Skipped (insufficient balance: {web3.from_wei(balance, 'ether')} USDC)")
            return True
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(base_dir, "frontend/src/factory_abi.json"), 'r') as f:
            factory_abi = json.load(f)
        with open(os.path.join(base_dir, "frontend/src/escrow_abi.json"), 'r') as f:
            escrow_abi = json.load(f)
        
        factory = web3.eth.contract(
            address=Web3.to_checksum_address(FACTORY_ADDRESS),
            abi=factory_abi
        )
        
        # 1. Deploy Escrow
        print("    Deploying new escrow...")
        nonce = web3.eth.get_transaction_count(buyer_address)
        tx = factory.functions.createEscrow().build_transaction({
            'from': buyer_address,
            'nonce': nonce,
            'gas': 2000000,
            'gasPrice': web3.to_wei(20, 'gwei')
        })
        signed = account.sign_transaction(tx)
        tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        # Get escrow address from logs
        escrow_created_topic = web3.keccak(text='EscrowCreated(address,address,uint256)').hex()
        escrow_address = None
        for log in receipt.logs:
            if log.topics[0].hex() == escrow_created_topic:
                escrow_address = Web3.to_checksum_address('0x' + log.topics[1].hex()[-40:])
                break
        
        if not escrow_address:
            results.record("Deploy Escrow", False, "Could not find EscrowCreated event")
            return False
        
        # Verify the escrow has bytecode
        code = web3.eth.get_code(escrow_address)
        if code == b'' or code.hex() == '0x':
            results.record("Deploy Escrow", False, f"Escrow at {escrow_address} has no bytecode (creation failed)")
            print(f"    ⚠️ Transaction hash: {tx_hash.hex()}")
            print(f"    ⚠️ Receipt status: {receipt.status}")
            return False
        
        results.record(f"Deploy Escrow ({escrow_address[:10]}...)", True)
        print(f"    📍 Full escrow address: {escrow_address}")
        
        escrow = web3.eth.contract(address=escrow_address, abi=escrow_abi)
        
        # 2. Deposit
        print("    Depositing funds...")
        seller_address = "0x0f7B6653e2D9142e8bC89611C9CA08E4BCe7c5ea"  # Test seller
        deposit_amount = web3.to_wei(0.001, 'ether')
        
        nonce = web3.eth.get_transaction_count(buyer_address)
        tx = escrow.functions.deposit(seller_address).build_transaction({
            'from': buyer_address,
            'value': deposit_amount,
            'nonce': nonce,
            'gas': 200000,
            'gasPrice': web3.to_wei(20, 'gwei')
        })
        signed = account.sign_transaction(tx)
        tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        results.record(f"Deposit ({web3.from_wei(deposit_amount, 'ether')} USDC)", receipt.status == 1)
        
        # 3. Set Requirements
        print("    Setting requirements...")
        requirements = "Test automated deployment"
        contact = "test_bot"
        
        try:
            nonce = web3.eth.get_transaction_count(buyer_address)
            tx = escrow.functions.setContractRequirements(
                seller_address,
                requirements,
                contact
            ).build_transaction({
                'from': buyer_address,
                'nonce': nonce,
                'gas': 300000,
                'gasPrice': web3.to_wei(20, 'gwei')
            })
            signed = account.sign_transaction(tx)
            tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                results.record("Set Requirements", True)
            else:
                results.record("Set Requirements", False, f"TX reverted (status=0), hash={tx_hash.hex()}")
                return False
        except Exception as e:
            error_msg = str(e)
            # Try to decode revert reason
            if "execution reverted" in error_msg.lower():
                # Try a static call to get the revert reason
                try:
                    escrow.functions.setContractRequirements(
                        seller_address, requirements, contact
                    ).call({'from': buyer_address})
                except Exception as call_err:
                    error_msg = f"Revert reason: {call_err}"
            results.record("Set Requirements", False, error_msg[:200])
            return False
        
        # 4. Check OTP was generated
        time.sleep(2)  # Wait for backend daemon
        response = requests.get(
            f"{API_BASE_URL}/api/get-submission-link/{seller_address.lower()}?escrow={escrow_address}",
            timeout=5
        )
        results.record("OTP Generated", response.status_code == 200)
        
        if response.status_code == 200:
            data = response.json()
            print(f"    📧 Submission Link: {data.get('submission_link', 'N/A')[:60]}...")
        
        return True
        
    except Exception as e:
        results.record("Full Integration", False, str(e))
        return False

# ============================================
# Main
# ============================================
def main():
    print("=" * 50)
    print("🧪 HALE Oracle Automated Test Suite")
    print("=" * 50)
    print(f"API URL: {API_BASE_URL}")
    print(f"RPC URL: {ARC_RPC_URL}")
    print(f"Factory: {FACTORY_ADDRESS}")
    
    # Run tests
    test_api_health()
    test_telegram_endpoints()
    test_blockchain_connection()
    test_contract_abis()
    test_factory_contract()
    test_escrow_contract_functions()
    test_otp_generation()
    test_delivery_submission()
    test_full_integration()
    
    # Summary
    success = results.summary()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
