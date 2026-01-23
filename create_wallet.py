#!/usr/bin/env python3
"""
Create a Traditional Wallet for HALE Oracle
Generates a wallet address and private key for use with HALE Oracle.
"""

import os
import sys
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

def create_wallet():
    """Create a new Ethereum/Arc wallet."""
    
    print("🔐 Creating HALE Oracle Wallet")
    print("=" * 60)
    print()
    
    # Generate a new account
    account = Account.create()
    
    address = account.address
    private_key = account.key.hex()
    
    print("✅ Wallet created successfully!")
    print()
    print("📋 Wallet Information:")
    print(f"   Address: {address}")
    print(f"   Private Key: {private_key}")
    print()
    print("⚠️  SECURITY WARNING:")
    print("   - Save this private key securely")
    print("   - Never share it or commit to git")
    print("   - This is the only time you'll see it")
    print()
    
    # Check if .env exists
    env_file = ".env"
    if os.path.exists(env_file):
        print(f"📝 Add these to your {env_file} file:")
        print()
        print(f"HALE_ORACLE_ADDRESS={address}")
        print(f"ORACLE_PRIVATE_KEY={private_key}")
        print()
        
        # Ask if user wants to update .env automatically
        try:
            response = input("Would you like to update .env automatically? (y/N): ").strip().lower()
            if response == 'y':
                update_env_file(env_file, address, private_key)
                print("✅ .env file updated!")
            else:
                print("⚠️  Please manually add the values to .env")
        except (KeyboardInterrupt, EOFError):
            print("\n⚠️  Please manually add the values to .env")
    else:
        print(f"📝 Create a {env_file} file with:")
        print()
        print(f"HALE_ORACLE_ADDRESS={address}")
        print(f"ORACLE_PRIVATE_KEY={private_key}")
        print()
    
    print("🚀 Next steps:")
    print("   1. Fund this wallet with testnet tokens: https://faucet.circle.com")
    print("   2. Use this address as HALE_ORACLE_ADDRESS in contract deployment")
    print("   3. Use hale_oracle_backend.py (not the Circle version)")
    print()
    
    return address, private_key


def update_env_file(env_file, address, private_key):
    """Update .env file with wallet information."""
    
    # Read existing .env
    lines = []
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            lines = f.readlines()
    
    # Update or add HALE_ORACLE_ADDRESS
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('HALE_ORACLE_ADDRESS='):
            lines[i] = f'HALE_ORACLE_ADDRESS={address}\n'
            updated = True
            break
    
    if not updated:
        lines.append(f'HALE_ORACLE_ADDRESS={address}\n')
    
    # Update or add ORACLE_PRIVATE_KEY
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('ORACLE_PRIVATE_KEY='):
            lines[i] = f'ORACLE_PRIVATE_KEY={private_key}\n'
            updated = True
            break
    
    if not updated:
        lines.append(f'ORACLE_PRIVATE_KEY={private_key}\n')
    
    # Write back
    with open(env_file, 'w') as f:
        f.writelines(lines)


if __name__ == "__main__":
    try:
        create_wallet()
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
