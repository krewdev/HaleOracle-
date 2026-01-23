#!/usr/bin/env python3
"""
Example usage of HALE Oracle with different scenarios.
"""

import json
import os
from hale_oracle_backend import HaleOracle

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, rely on system environment

# Get RPC URL from environment
ARC_RPC_URL = os.getenv("ARC_TESTNET_RPC_URL", "https://rpc.testnet.arc.network")


def example_pass():
    """Example of a delivery that should PASS."""
    print("\n" + "="*60)
    print("EXAMPLE 1: Valid Python Script (Should PASS)")
    print("="*60)
    
    contract_data = {
        "transaction_id": "tx_0x123abc_arc",
        "Contract_Terms": "Generate a Python script to fetch the current price of USDC using the CoinGecko API.",
        "Acceptance_Criteria": [
            "Must be written in Python 3",
            "Must handle API errors gracefully",
            "Must print the price to console"
        ],
        "Delivery_Content": """import requests

def get_usdc_price():
    url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd'
    try:
        response = requests.get(url)
        data = response.json()
        print(f'Current USDC Price: ${data["usd-coin"]["usd"]}')
    except Exception as e:
        print('Error fetching price')

get_usdc_price()"""
    }
    
    return contract_data


def example_fail():
    """Example of a delivery that should FAIL."""
    print("\n" + "="*60)
    print("EXAMPLE 2: Missing Error Handling (Should FAIL)")
    print("="*60)
    
    contract_data = {
        "transaction_id": "tx_0x456def_arc",
        "Contract_Terms": "Generate a Python script to fetch the current price of USDC using the CoinGecko API.",
        "Acceptance_Criteria": [
            "Must be written in Python 3",
            "Must handle API errors gracefully",
            "Must print the price to console"
        ],
        "Delivery_Content": """import requests

def get_usdc_price():
    url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd'
    response = requests.get(url)
    data = response.json()
    print(f'Current USDC Price: ${data["usd-coin"]["usd"]}')

get_usdc_price()"""
    }
    
    return contract_data


def example_security_fail():
    """Example of a delivery with security issues that should FAIL."""
    print("\n" + "="*60)
    print("EXAMPLE 3: Security Risk - Infinite Loop (Should FAIL)")
    print("="*60)
    
    contract_data = {
        "transaction_id": "tx_0x789ghi_arc",
        "Contract_Terms": "Generate a Python script to fetch the current price of USDC.",
        "Acceptance_Criteria": [
            "Must be written in Python 3",
            "Must be safe to execute"
        ],
        "Delivery_Content": """import requests

def get_usdc_price():
    while True:  # Infinite loop - security risk!
        url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd'
        response = requests.get(url)
        data = response.json()
        print(f'Current USDC Price: ${data["usd-coin"]["usd"]}')

get_usdc_price()"""
    }
    
    return contract_data


def main():
    """Run example scenarios."""
    
    # Get API key
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        print("Get your API key from: https://aistudio.google.com/apikey")
        return
    
    # Initialize oracle
    oracle = HaleOracle(
        gemini_api_key=gemini_api_key,
        arc_rpc_url=os.getenv('ARC_TESTNET_RPC_URL', ARC_RPC_URL)
    )
    
    # Test scenarios
    scenarios = [
        ("Valid Delivery", example_pass, "0xSellerAddress123"),
        ("Missing Error Handling", example_fail, "0xSellerAddress456"),
        ("Security Risk", example_security_fail, "0xSellerAddress789"),
    ]
    
    results = []
    
    for scenario_name, scenario_func, seller_address in scenarios:
        contract_data = scenario_func()
        result = oracle.process_delivery(contract_data, seller_address)
        results.append((scenario_name, result))
        
        print(f"\nResult: {result['verdict']} (Confidence: {result['confidence_score']}%)")
        print(f"Release Funds: {result['release_funds']}")
        print(f"Reasoning: {result['reasoning']}")
        if result.get('risk_flags'):
            print(f"Risk Flags: {', '.join(result['risk_flags'])}")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for scenario_name, result in results:
        status = "✅ PASS" if result['verdict'] == 'PASS' else "❌ FAIL"
        print(f"{status} - {scenario_name}: {result['reasoning']}")


if __name__ == '__main__':
    main()
