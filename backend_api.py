#!/usr/bin/env python3
"""
HALE Oracle Backend API Server
Provides REST API endpoints for the frontend to interact with the oracle.
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from hale_oracle_backend import HaleOracle
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize oracle
gemini_api_key = os.getenv('GEMINI_API_KEY')
arc_rpc_url = os.getenv('ARC_TESTNET_RPC_URL', 'https://rpc.testnet.arc.network')

if not gemini_api_key:
    print("WARNING: GEMINI_API_KEY not set. Verification will fail.")

oracle = HaleOracle(
    gemini_api_key=gemini_api_key,
    arc_rpc_url=arc_rpc_url
) if gemini_api_key else None


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'oracle_configured': oracle is not None
    })


@app.route('/api/verify', methods=['POST'])
def verify():
    """
    Verify a delivery against contract terms.
    
    Request body:
    {
        "contract_data": {
            "transaction_id": "...",
            "Contract_Terms": "...",
            "Acceptance_Criteria": [...],
            "Delivery_Content": "..."
        },
        "seller_address": "0x..." (optional)
    }
    """
    try:
        data = request.json
        
        if not data or 'contract_data' not in data:
            return jsonify({'error': 'Missing contract_data in request'}), 400
        
        contract_data = data['contract_data']
        seller_address = data.get('seller_address')
        
        # Validate required fields
        required_fields = ['Contract_Terms', 'Acceptance_Criteria', 'Delivery_Content']
        for field in required_fields:
            if field not in contract_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        if not oracle:
            return jsonify({
                'error': 'Oracle not configured. Please set GEMINI_API_KEY environment variable.'
            }), 500
        
        # Verify delivery
        if seller_address:
            result = oracle.process_delivery(contract_data, seller_address)
        else:
            result = oracle.verify_delivery(contract_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500


@app.route('/api/monitor/<contract_address>', methods=['GET'])
def monitor(contract_address):
    """
    Get monitoring stats for a contract address.
    This is a placeholder - in production, you'd query the blockchain.
    """
    try:
        # TODO: Query blockchain for actual stats
        # For now, return mock data
        return jsonify({
            'totalDeposits': '12.5',
            'totalReleases': '8.2',
            'totalRefunds': '1.3',
            'activeEscrows': 5,
            'totalTransactions': 23,
            'successRate': 87.5,
            'contractAddress': contract_address
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/format', methods=['POST'])
def format_data():
    """
    Format user input into the correct format for the oracle.
    This endpoint helps users convert their data to the expected format.
    """
    try:
        data = request.json
        
        formatted = {
            'transaction_id': data.get('transaction_id', f'tx_{int(__import__("time").time())}_arc'),
            'Contract_Terms': data.get('Contract_Terms', ''),
            'Acceptance_Criteria': data.get('Acceptance_Criteria', []),
            'Delivery_Content': data.get('Delivery_Content', '')
        }
        
        # Filter out empty criteria
        formatted['Acceptance_Criteria'] = [
            c for c in formatted['Acceptance_Criteria'] 
            if c and c.strip()
        ]
        
        return jsonify({
            'formatted': formatted,
            'valid': all([
                formatted['Contract_Terms'],
                len(formatted['Acceptance_Criteria']) > 0,
                formatted['Delivery_Content']
            ])
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 8000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting HALE Oracle API server on port {port}")
    print(f"Oracle configured: {oracle is not None}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
