#!/usr/bin/env python3
"""
Quick Demo Script for HACKATHON
Shows HALE Oracle verifying a custom delivery in real-time.
"""

import os
import sys
from hale_oracle_backend import HaleOracle
from dotenv import load_dotenv

load_dotenv()

def demo_verification():
    """Run a quick demo verification."""
    
    print("=" * 70)
    print("🎯 HALE ORACLE - LIVE DEMO")
    print("=" * 70)
    print()
    
    # Initialize oracle
    gemini_key = os.getenv('GEMINI_API_KEY')
    rpc_url = os.getenv('ARC_TESTNET_RPC_URL')
    
    if not gemini_key:
        print("❌ GEMINI_API_KEY not set")
        return
    
    print("🔧 Initializing HALE Oracle...")
    oracle = HaleOracle(gemini_key, rpc_url)
    print(f"✅ Oracle ready (Model: {oracle.model_name})")
    print()
    
    # Demo contract
    print("📋 Demo Contract:")
    print("   Task: Create a Python function to calculate factorial")
    print("   Criteria:")
    print("     - Must be in Python")
    print("     - Must handle edge cases (0, negative)")
    print("     - Must include error handling")
    print()
    
    contract_data = {
        "transaction_id": "hackathon_demo_001",
        "Contract_Terms": "Create a Python function that calculates the factorial of a number",
        "Acceptance_Criteria": [
            "Must be written in Python",
            "Must handle edge cases (0, negative numbers)",
            "Must include error handling",
            "Must return correct result"
        ],
        "Delivery_Content": """
def factorial(n):
    \"\"\"Calculate factorial of a number.\"\"\"
    if not isinstance(n, int):
        raise TypeError("Input must be an integer")
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n == 0 or n == 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
"""
    }
    
    print("🔍 Verifying delivery...")
    print()
    
    # Verify
    result = oracle.verify_delivery(contract_data)
    
    # Display results
    print("=" * 70)
    print("📊 VERIFICATION RESULT")
    print("=" * 70)
    print()
    print(f"Verdict: {'✅ PASS' if result['verdict'] == 'PASS' else '❌ FAIL'}")
    print(f"Confidence: {result['confidence_score']}%")
    print()
    print("Reasoning:")
    print(f"  {result['reasoning']}")
    print()
    
    if result.get('risk_flags'):
        print("Risk Flags:")
        for flag in result['risk_flags']:
            print(f"  ⚠️  {flag}")
        print()
    
    print(f"Release Funds: {'✅ YES' if result.get('release_funds') else '❌ NO'}")
    print()
    print("=" * 70)
    print()
    
    # Show contract info
    print("📦 Smart Contract:")
    print("   Address: 0xB47952F4897cE753d972A8929621F816dcb03e63")
    print("   Network: Arc Testnet")
    print("   Explorer: https://testnet.arcscan.app/address/0xB47952F4897cE753d972A8929621F816dcb03e63")
    print()
    
    return result

if __name__ == "__main__":
    try:
        demo_verification()
    except KeyboardInterrupt:
        print("\n\nDemo cancelled.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
