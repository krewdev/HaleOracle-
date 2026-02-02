#!/usr/bin/env python3
"""
Test script to simulate the complete HALE Oracle flow
"""

import json
import time
from hale_oracle_backend import HaleOracle
import os

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv('.env.local')
except:
    pass

def test_complete_flow():
    """Test the complete Oracle verification flow"""
    
    print("=" * 60)
    print("HALE ORACLE - COMPLETE FLOW TEST")
    print("=" * 60)
    print()
    
    # Initialize Oracle
    print("1️⃣  Initializing Oracle...")
    gemini_key = os.getenv('GEMINI_API_KEY')
    arc_rpc = os.getenv('ARC_RPC_URL')
    
    oracle = HaleOracle(gemini_key, arc_rpc)
    print(f"   ✅ Oracle initialized")
    print(f"   📡 Gemini Mode: {'Mock' if oracle.mock_mode else 'Live'}")
    print(f"   🔗 Blockchain: {'Connected' if oracle.web3 and oracle.web3.is_connected() else 'Disconnected'}")
    print()
    
    # Simulate contract data (as would come from frontend)
    print("2️⃣  Simulating Delivery Submission...")
    
    contract_data = {
        'transaction_id': f"test_delivery_{int(time.time())}",
        'Contract_Terms': 'Create a simple ERC20 token contract with name "TestToken", symbol "TST", and 1000000 initial supply',
        'Acceptance_Criteria': [
            'Must be a valid Solidity contract',
            'Must implement ERC20 standard',
            'Must have correct name and symbol',
            'Must compile without errors',
            'Must not have security vulnerabilities'
        ],
        'Delivery_Content': '''
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestToken {
    string public name = "TestToken";
    string public symbol = "TST";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
''',
        'escrow_address': '0x1234567890123456789012345678901234567890'
    }
    
    seller_address = '0xSellerAddress123456789'
    
    print(f"   📋 Contract Terms: {contract_data['Contract_Terms'][:60]}...")
    print(f"   👤 Seller: {seller_address}")
    print()
    
    # Process delivery
    print("3️⃣  Processing Delivery through Oracle...")
    print()
    
    result = oracle.process_delivery(contract_data, seller_address)
    
    print()
    print("=" * 60)
    print("VERIFICATION RESULTS")
    print("=" * 60)
    print()
    print(f"📊 Verdict: {result.get('verdict')}")
    print(f"🎯 Confidence: {result.get('confidence_score')}%")
    print(f"💰 Release Funds: {result.get('release_funds')}")
    print(f"🔐 Transaction Success: {result.get('transaction_success')}")
    print()
    print(f"💭 Reasoning:")
    print(f"   {result.get('reasoning')}")
    print()
    
    if result.get('risk_flags'):
        print(f"⚠️  Risk Flags:")
        for flag in result['risk_flags']:
            print(f"   - {flag}")
        print()
    
    # Determine outcome
    confidence = result.get('confidence_score', 0)
    if confidence >= 90:
        print("✅ OUTCOME: Funds would be AUTO-RELEASED (≥90% confidence)")
    elif confidence >= 70:
        print("⏸️  OUTCOME: Queued for HUMAN REVIEW (70-89% confidence)")
    else:
        print("❌ OUTCOME: AUTO-REFUND to buyer (<70% confidence)")
    
    print()
    print("=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    
    return result

if __name__ == '__main__':
    test_complete_flow()
