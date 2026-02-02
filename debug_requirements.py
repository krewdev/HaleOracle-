#!/usr/bin/env python3
"""
Debug script to check why setContractRequirements is reverting
"""
import os
import json
from web3 import Web3

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

ARC_RPC_URL = "https://rpc.testnet.arc.network"
ESCROW_ADDRESS = "0x8d45815FFf51EAe66E4659F17e3F3a8b8b5Ed0E5"  # From test output (checksum)
BUYER_ADDRESS = os.getenv("BUYER_ADDRESS", "0xb000dFC8D1CB290834cc59BEe0fBC4e2fd5aD3E3")  # From test
SELLER_ADDRESS = "0x0f7B6653e2D9142e8bC89611C9CA08E4BCe7c5ea"

def main():
    web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
    if not web3.is_connected():
        print("❌ Not connected to blockchain")
        return
    
    print(f"🔍 Debugging Escrow at {ESCROW_ADDRESS}")
    print(f"   Buyer: {BUYER_ADDRESS}")
    print(f"   Seller: {SELLER_ADDRESS}")
    print()
    
    with open('frontend/src/escrow_abi.json', 'r') as f:
        abi = json.load(f)
    
    escrow = web3.eth.contract(address=Web3.to_checksum_address(ESCROW_ADDRESS), abi=abi)
    
    # Check deposits
    try:
        balance = escrow.functions.deposits(SELLER_ADDRESS).call()
        print(f"✅ deposits[{SELLER_ADDRESS[:10]}...] = {web3.from_wei(balance, 'ether')} ETH")
    except Exception as e:
        print(f"❌ deposits check failed: {e}")
        return
    
    # Check isExistingDepositor
    try:
        is_depositor = escrow.functions.isExistingDepositor(SELLER_ADDRESS, BUYER_ADDRESS).call()
        print(f"{'✅' if is_depositor else '❌'} isExistingDepositor[seller][buyer] = {is_depositor}")
    except Exception as e:
        print(f"⚠️ isExistingDepositor check failed (may not exist in this ABI): {e}")
    
    # Check depositorCount
    try:
        count = escrow.functions.depositorCount(SELLER_ADDRESS).call()
        print(f"✅ depositorCount[seller] = {count}")
    except Exception as e:
        print(f"⚠️ depositorCount check failed: {e}")
    
    # Check getDepositors
    try:
        depositors = escrow.functions.getDepositors(SELLER_ADDRESS).call()
        print(f"✅ getDepositors[seller] = {depositors}")
    except Exception as e:
        print(f"⚠️ getDepositors check failed: {e}")
    
    # Check oracle
    try:
        oracle = escrow.functions.oracle().call()
        print(f"✅ oracle = {oracle}")
    except Exception as e:
        print(f"❌ oracle check failed: {e}")
    
    # Check owner
    try:
        owner = escrow.functions.owner().call()
        print(f"✅ owner = {owner}")
    except Exception as e:
        print(f"❌ owner check failed: {e}")
    
    print()
    print("Summary of Requirements:")
    print("  1. requirements.length > 0: ✅ (we send 'Test automated deployment')")
    print(f"  2. deposits[seller] > 0: {'✅' if balance > 0 else '❌'}")
    try:
        is_depositor = escrow.functions.isExistingDepositor(SELLER_ADDRESS, BUYER_ADDRESS).call()
        print(f"  3. isExistingDepositor[seller][buyer]: {'✅' if is_depositor else '❌'}")
    except:
        print("  3. isExistingDepositor[seller][buyer]: ⚠️ Cannot verify")

if __name__ == "__main__":
    main()
