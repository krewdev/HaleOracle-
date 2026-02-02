
import os
import json
from web3 import Web3

# Configuration
ARC_RPC_URL = "https://rpc.testnet.arc.network"
ESCROW_ADDRESS = "0x271685e6De71e2FbbAE3Efdd9327Ad0eF2269D3C" # From user logs
DEPOSITOR = "0xb000dFC8D1CB290834cc59BEe0fBC4e2fd5aD3E3" # From user logs

def check_state():
    web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
    if not web3.is_connected():
        print("Failed to connect to RPC")
        return

    print(f"Checking Escrow at {ESCROW_ADDRESS}...")
    
    # Load ABI
    with open('frontend/src/escrow_abi.json', 'r') as f:
        abi = json.load(f)
    
    contract = web3.eth.contract(address=ESCROW_ADDRESS, abi=abi)
    
    # 1. Find the seller from Deposit events
    print("Scanning for Deposit events...")
    try:
        latest = web3.eth.block_number
        logs = contract.events.Deposit().get_logs(from_block=latest-1000)
        if not logs:
            print("❌ No Deposit events found! (Did the deposit tx fail?)")
            return
            
        print(f"Found {len(logs)} deposit events.")
        for log in logs:
            seller = log['args']['seller']
            depositor = log['args']['depositor']
            amount = log['args']['amount']
            print(f"  - Seller: {seller}, Depositor: {depositor}, Amount: {amount}")
            
            if depositor.lower() == DEPOSITOR.lower():
                print(f"  ✅ Verified match for depositor {DEPOSITOR}")
                
                # Check isExistingDepositor
                is_depositor = contract.functions.isExistingDepositor(seller, DEPOSITOR).call()
                print(f"  -> isExistingDepositor[{seller}][{DEPOSITOR}] = {is_depositor}")
                
                if not is_depositor:
                    print("  ❌ ERROR: Contract says you are NOT a depositor!")
                else:
                    print("  ✅ Contract recognizes you as a depositor.")
                
                # Check deposits
                balance = contract.functions.deposits(seller).call()
                print(f"  -> deposits[{seller}] = {balance}")
                
    except Exception as e:
        print(f"Error reading logs: {e}")

if __name__ == "__main__":
    check_state()
