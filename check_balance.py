#!/usr/bin/env python3
"""
Check Wallet Balance on Arc Testnet
Shows USDC balance and native token balance for your HALE Oracle wallet.
"""

import os
import sys
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

def check_balance():
    """Check wallet balance on Arc Testnet."""
    
    print("💰 Checking Wallet Balance")
    print("=" * 60)
    print()
    
    # Get wallet address
    wallet_address = os.getenv("HALE_ORACLE_ADDRESS")
    if not wallet_address:
        print("❌ HALE_ORACLE_ADDRESS not set in .env file")
        print("   Run: python3 create_wallet.py")
        return False
    
    # Get RPC URL
    rpc_url = os.getenv("ARC_TESTNET_RPC_URL", "https://rpc.testnet.arc.network")
    
    print(f"📍 Network: Arc Testnet")
    print(f"🔗 RPC: {rpc_url}")
    print(f"👛 Address: {wallet_address}")
    print()
    
    try:
        # Connect to Arc Testnet
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        if not w3.is_connected():
            print("❌ Failed to connect to Arc Testnet")
            print(f"   RPC URL: {rpc_url}")
            return False
        
        print("✅ Connected to Arc Testnet")
        print()
        
        # Check if address is valid
        if not w3.is_address(wallet_address):
            print(f"❌ Invalid address: {wallet_address}")
            return False
        
        # Get native token balance (USDC on Arc Testnet)
        balance_raw = w3.eth.get_balance(wallet_address)
        
        # Arc Testnet uses USDC as native currency
        # The balance is returned in the smallest unit
        # USDC has 6 decimals, but the native balance might be in 18 decimals (wei format)
        # Try both formats to see which matches
        balance_usdc_6dec = balance_raw / (10 ** 6)  # USDC standard (6 decimals)
        balance_usdc_18dec = balance_raw / (10 ** 18)  # Wei format (18 decimals)
        
        # Use the more reasonable value (likely 18 decimals based on Ethereum standard)
        # But display as USDC
        balance_usdc = balance_usdc_18dec
        
        print("💵 USDC Balance (Native Token):")
        print(f"   {balance_usdc:,.2f} USDC")
        print(f"   ({balance_raw:,} smallest units)")
        print()
        
        # Note: On Arc Testnet, USDC is the native currency
        # If you need to check ERC20 token balances, add the contract address to .env
        
        # Check if balance is zero
        if balance_raw == 0:
            print("⚠️  Wallet has zero balance!")
            print()
            print("🚰 Get testnet tokens:")
            print("   https://faucet.circle.com/")
            print(f"   Address: {wallet_address}")
            print()
        else:
            print("✅ Wallet has funds!")
            print()
        
        # Show explorer link
        explorer = "https://testnet.arcscan.app"
        print(f"🔍 View on Explorer:")
        print(f"   {explorer}/address/{wallet_address}")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking balance: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    try:
        success = check_balance()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)
