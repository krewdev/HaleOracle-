#!/usr/bin/env python3
"""
Deploy new ArcFuseEscrowFactory to Arc Testnet
"""
import os
import json
from web3 import Web3
from eth_account import Account

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

ARC_RPC_URL = os.getenv("ARC_TESTNET_RPC_URL", "https://rpc.testnet.arc.network")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ORACLE_ADDRESS = os.getenv("ORACLE_ADDRESS", "0x876f7ee6D6AA43c5A6cC13c05522eb47363E5907")  # Fallback to deployer

def main():
    if not PRIVATE_KEY:
        print("❌ PRIVATE_KEY not set in .env")
        return
    
    web3 = Web3(Web3.HTTPProvider(ARC_RPC_URL))
    if not web3.is_connected():
        print("❌ Not connected to blockchain")
        return
    
    account = Account.from_key(PRIVATE_KEY)
    deployer = account.address
    print(f"🔑 Deployer: {deployer}")
    
    balance = web3.eth.get_balance(deployer)
    print(f"💰 Balance: {web3.from_wei(balance, 'ether')} USDC")
    
    if balance < web3.to_wei(0.1, 'ether'):
        print("❌ Insufficient balance for deployment")
        return
    
    # Load Factory artifact
    with open('artifacts/contracts/ArcFuseEscrowFactory.sol/ArcFuseEscrowFactory.json', 'r') as f:
        factory_artifact = json.load(f)
    
    factory_abi = factory_artifact['abi']
    factory_bytecode = factory_artifact['bytecode']
    
    # Create contract instance
    Factory = web3.eth.contract(abi=factory_abi, bytecode=factory_bytecode)
    
    # Build deployment transaction
    print(f"🚀 Deploying ArcFuseEscrowFactory with oracle: {ORACLE_ADDRESS}")
    
    nonce = web3.eth.get_transaction_count(deployer)
    tx = Factory.constructor(ORACLE_ADDRESS).build_transaction({
        'from': deployer,
        'nonce': nonce,
        'gas': 5000000,
        'gasPrice': web3.to_wei(20, 'gwei')
    })
    
    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"📤 TX Hash: {tx_hash.hex()}")
    
    print("⏳ Waiting for confirmation...")
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    
    if receipt.status == 1:
        factory_address = receipt.contractAddress
        print(f"")
        print(f"✅ Factory deployed successfully!")
        print(f"📍 Factory Address: {factory_address}")
        print(f"")
        print(f"🔧 Update your .env with:")
        print(f"   FACTORY_CONTRACT_ADDRESS={factory_address}")
        print(f"")
        print(f"🔧 Update frontend/src/utils/wallet.js with:")
        print(f"   factoryAddress: \"{factory_address}\"")
    else:
        print(f"❌ Deployment failed (status=0)")
        print(f"   TX Hash: {tx_hash.hex()}")

if __name__ == "__main__":
    main()
