#!/usr/bin/env python3
"""
Refund funds from escrow (Oracle only)
"""
import os
import sys
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import json

load_dotenv()

def refund_funds(seller_address, reason):
    """Refund funds to buyers after failed verification."""
    
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
    
    # Get depositors
    depositors = contract.functions.getDepositors(Web3.to_checksum_address(seller_address)).call()
    if len(depositors) == 0:
        print(f"ERROR: No depositors found for seller {seller_address}")
        sys.exit(1)
    
    print(f"\n💰 Refunding {Web3.from_wei(balance, 'ether')} ETH to {len(depositors)} depositor(s)")
    print(f"Reason: {reason}")
    print(f"\nDepositors:")
    for i, dep in enumerate(depositors, 1):
        print(f"  {i}. {dep[0]}: {Web3.from_wei(dep[1], 'ether')} ETH")
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(oracle_account.address)
    gas_price = w3.eth.gas_price
    
    try:
        tx = contract.functions.refund(
            Web3.to_checksum_address(seller_address),
            reason
        ).build_transaction({
            'from': oracle_account.address,
            'nonce': nonce,
            'gas': 200000,  # More gas for multiple refunds
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
            print(f"\n✅ Refund confirmed in block {receipt.blockNumber}")
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
    reason = os.getenv('REFUND_REASON', 'VERIFICATION_FAILED')
    
    if not seller:
        print("ERROR: SELLER_ADDRESS not set in .env")
        sys.exit(1)
    
    refund_funds(seller, reason)
