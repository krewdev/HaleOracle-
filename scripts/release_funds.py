#!/usr/bin/env python3
"""
Release funds from escrow (Oracle only)
"""
import os
import sys
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import json

load_dotenv()

def release_funds(seller_address, transaction_id):
    """Release funds to seller after successful verification."""
    
    # Connect to Arc
    rpc_url = os.getenv('ARC_TESTNET_RPC_URL')
    if not rpc_url:
        print("ERROR: ARC_TESTNET_RPC_URL not set in .env")
        sys.exit(1)
    
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("ERROR: Could not connect to Arc network")
        sys.exit(1)
    
    # Load contract
    contract_address = os.getenv('ESCROW_CONTRACT_ADDRESS')
    if not contract_address:
        print("ERROR: ESCROW_CONTRACT_ADDRESS not set in .env")
        sys.exit(1)
    
    with open('escrow_abi.json', 'r') as f:
        abi = json.load(f)
    
    contract = w3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=abi)
    
    # Get oracle account
    oracle_key = os.getenv('ORACLE_PRIVATE_KEY')
    if not oracle_key:
        print("ERROR: ORACLE_PRIVATE_KEY not set in .env")
        sys.exit(1)
    
    oracle_account = Account.from_key(oracle_key)
    
    # Verify oracle address matches contract
    contract_oracle = contract.functions.oracle().call()
    if contract_oracle.lower() != oracle_account.address.lower():
        print(f"ERROR: Oracle address mismatch!")
        print(f"  Contract oracle: {contract_oracle}")
        print(f"  Your address: {oracle_account.address}")
        sys.exit(1)
    
    # Check balance
    balance = contract.functions.deposits(Web3.to_checksum_address(seller_address)).call()
    if balance == 0:
        print(f"ERROR: No funds in escrow for seller {seller_address}")
        sys.exit(1)
    
    print(f"\n💰 Releasing {Web3.from_wei(balance, 'ether')} ETH to seller {seller_address}")
    print(f"Transaction ID: {transaction_id}")
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(oracle_account.address)
    gas_price = w3.eth.gas_price
    
    try:
        tx = contract.functions.release(
            Web3.to_checksum_address(seller_address),
            transaction_id
        ).build_transaction({
            'from': oracle_account.address,
            'nonce': nonce,
            'gas': 150000,
            'gasPrice': gas_price,
            'chainId': 11155111  # Update with actual Arc testnet chain ID
        })
        
        # Sign and send
        signed_tx = oracle_account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        print(f"\n📤 Transaction submitted: {tx_hash.hex()}")
        print(f"View on explorer: https://testnet.arcscan.app/tx/{tx_hash.hex()}")
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if receipt.status == 1:
            print(f"\n✅ Release confirmed in block {receipt.blockNumber}")
            return tx_hash.hex()
        else:
            print(f"\n❌ Transaction failed")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        if "Only Oracle can call" in str(e):
            print("   Make sure you're using the oracle private key")
        sys.exit(1)

if __name__ == '__main__':
    seller = os.getenv('SELLER_ADDRESS')
    tx_id = os.getenv('TRANSACTION_ID', f'tx_{int(__import__("time").time())}_arc')
    
    if not seller:
        print("ERROR: SELLER_ADDRESS not set in .env")
        sys.exit(1)
    
    release_funds(seller, tx_id)
