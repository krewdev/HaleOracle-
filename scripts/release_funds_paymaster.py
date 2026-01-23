#!/usr/bin/env python3
"""
Release funds using paymaster (Oracle doesn't need native currency)
"""
import os
import sys
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import json

# Add parent directory to path to import paymaster_manager
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from paymaster_manager import PaymasterManager

load_dotenv()

def release_funds_with_paymaster(seller_address, transaction_id):
    """Release funds using paymaster sponsorship."""
    
    # Connect to Arc
    rpc_url = os.getenv('ARC_TESTNET_RPC_URL')
    if not rpc_url:
        print("ERROR: ARC_TESTNET_RPC_URL not set in .env")
        sys.exit(1)
    
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("ERROR: Could not connect to Arc network")
        sys.exit(1)
    
    # Load escrow contract
    escrow_address = os.getenv('ESCROW_CONTRACT_ADDRESS')
    if not escrow_address:
        print("ERROR: ESCROW_CONTRACT_ADDRESS not set in .env")
        sys.exit(1)
    
    with open('escrow_abi.json', 'r') as f:
        escrow_abi = json.load(f)
    
    # Load paymaster
    paymaster_address = os.getenv('PAYMASTER_ADDRESS')
    if not paymaster_address:
        print("ERROR: PAYMASTER_ADDRESS not set in .env")
        sys.exit(1)
    
    with open('paymaster_abi.json', 'r') as f:
        paymaster_abi = json.load(f)
    
    # Get oracle account
    oracle_key = os.getenv('ORACLE_PRIVATE_KEY')
    if not oracle_key:
        print("ERROR: ORACLE_PRIVATE_KEY not set in .env")
        sys.exit(1)
    
    oracle_account = Account.from_key(oracle_key)
    
    # Initialize paymaster manager
    paymaster = PaymasterManager(w3, paymaster_address, paymaster_abi)
    
    # Check oracle authorization
    if not paymaster.is_oracle_authorized(oracle_account.address):
        print(f"ERROR: Oracle {oracle_account.address} is not authorized in paymaster")
        print("   Contact paymaster owner to authorize your oracle address")
        sys.exit(1)
    
    # Check paymaster balance
    balance = paymaster.check_balance()
    if balance == 0:
        print("ERROR: Paymaster has no balance")
        print("   Sponsors need to deposit funds to paymaster")
        sys.exit(1)
    
    print(f"\n💰 Releasing funds using paymaster...")
    print(f"   Seller: {seller_address}")
    print(f"   Transaction ID: {transaction_id}")
    print(f"   Paymaster balance: {Web3.from_wei(balance, 'ether')} ETH")
    
    # Sponsor transaction through paymaster
    result = paymaster.sponsor_transaction(
        oracle_address=oracle_account.address,
        target_contract=escrow_address,
        function_name='release',
        function_args=(Web3.to_checksum_address(seller_address), transaction_id),
        contract_abi=escrow_abi,
        gas_limit=150000
    )
    
    if result.get('success'):
        print(f"\n✅ Funds released successfully!")
        print(f"   Transaction: {result['tx_hash']}")
        print(f"   Block: {result['block_number']}")
        print(f"   Gas used: {result['gas_used']}")
        return result['tx_hash']
    else:
        print(f"\n❌ Release failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)

if __name__ == '__main__':
    seller = os.getenv('SELLER_ADDRESS')
    tx_id = os.getenv('TRANSACTION_ID', f'tx_{int(__import__("time").time())}_arc')
    
    if not seller:
        print("ERROR: SELLER_ADDRESS not set in .env")
        sys.exit(1)
    
    release_funds_with_paymaster(seller, tx_id)
