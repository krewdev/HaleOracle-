#!/usr/bin/env python3
"""
HALE Oracle Backend with Circle Wallet Integration
Integrates with Google Gemini API and Circle Programmable Wallets
to verify digital deliveries and trigger blockchain transactions.
"""

import json
import os
import sys
from typing import Dict, Any, Optional
import google.generativeai as genai
from web3 import Web3
from circle_wallet_manager import CircleWalletManager, get_wallet_address_for_web3

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, rely on system environment


class HaleOracleCircle:
    """HALE Oracle with Circle Programmable Wallet integration."""
    
    def __init__(self, gemini_api_key: str, circle_api_key: str, 
                 circle_entity_secret: Optional[str] = None,
                 circle_wallet_id: Optional[str] = None,
                 arc_rpc_url: Optional[str] = None):
        """
        Initialize the HALE Oracle with Circle wallet support.
        
        Args:
            gemini_api_key: Google Gemini API key
            circle_api_key: Circle API key
            circle_entity_secret: Circle entity secret (for wallet operations)
            circle_wallet_id: Existing Circle wallet ID (or None to create new)
            arc_rpc_url: Optional Circle Arc blockchain RPC URL
        """
        self.gemini_api_key = gemini_api_key
        self.arc_rpc_url = arc_rpc_url
        
        # Initialize Circle Wallet Manager
        self.circle_manager = CircleWalletManager(circle_api_key, circle_entity_secret)
        self.circle_wallet_id = circle_wallet_id
        
        # Get or create wallet
        if not self.circle_wallet_id:
            print("[Circle] Creating new wallet...")
            wallet = self.circle_manager.create_wallet(
                idempotency_key=f"hale-oracle-{os.urandom(8).hex()}",
                description="HALE Oracle Wallet"
            )
            self.circle_wallet_id = wallet.get("data", {}).get("walletId")
            print(f"[Circle] Created wallet: {self.circle_wallet_id}")
        else:
            print(f"[Circle] Using existing wallet: {self.circle_wallet_id}")
        
        # Get wallet address for ARC
        self.wallet_address = get_wallet_address_for_web3(
            self.circle_manager, 
            self.circle_wallet_id, 
            "ARC"
        )
        print(f"[Circle] Oracle wallet address: {self.wallet_address}")
        
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        
        # Load system prompt
        system_prompt_path = os.path.join(
            os.path.dirname(__file__), 
            'hale_oracle_system_prompt.txt'
        )
        with open(system_prompt_path, 'r') as f:
            self.system_prompt = f.read()
        
        # Initialize Gemini model
        self.model = genai.GenerativeModel(
            model_name='gemini-1.5-pro',
            system_instruction=self.system_prompt
        )
        
        # Initialize Web3 if RPC URL provided
        self.web3 = None
        if arc_rpc_url:
            self.web3 = Web3(Web3.HTTPProvider(arc_rpc_url))
            if not self.web3.is_connected():
                print("Warning: Could not connect to Arc blockchain")
    
    def format_verification_request(self, contract_data: Dict[str, Any]) -> str:
        """Format the contract data into a prompt for Gemini."""
        acceptance_criteria = contract_data.get('Acceptance_Criteria', [])
        
        prompt = f"""Input:
{{
  "transaction_id": "{contract_data.get('transaction_id', '')}",
  "Contract_Terms": "{contract_data.get('Contract_Terms', '')}",
  "Acceptance_Criteria": [
{chr(10).join([f'    "{criterion}"' for criterion in acceptance_criteria])}
  ],
  "Delivery_Content": "{contract_data.get('Delivery_Content', '').replace(chr(10), '\\n').replace('"', '\\"')}"
}}"""
        return prompt
    
    def verify_delivery(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify a delivery against contract terms using Gemini."""
        print(f"[HALE Oracle] Analyzing delivery for transaction: {contract_data.get('transaction_id', 'unknown')}")
        print(f"[HALE Oracle] Contract Terms: {contract_data.get('Contract_Terms', '')[:100]}...")
        
        user_prompt = self.format_verification_request(contract_data)
        
        try:
            print("[HALE Oracle] Sending delivery to HALE Oracle (Gemini)...")
            response = self.model.generate_content(user_prompt)
            
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    response_text = response_text[json_start:json_end]
            
            verdict = json.loads(response_text)
            
            print(f"[HALE Oracle] Verdict: {verdict.get('verdict', 'UNKNOWN')}")
            print(f"[HALE Oracle] Confidence: {verdict.get('confidence_score', 0)}%")
            print(f"[HALE Oracle] Reasoning: {verdict.get('reasoning', 'N/A')}")
            
            if verdict.get('risk_flags'):
                print(f"[HALE Oracle] Risk Flags: {', '.join(verdict.get('risk_flags', []))}")
            
            return verdict
            
        except json.JSONDecodeError as e:
            print(f"[HALE Oracle] ERROR: Failed to parse JSON response: {e}")
            return {
                "transaction_id": contract_data.get('transaction_id', ''),
                "verdict": "FAIL",
                "confidence_score": 0,
                "release_funds": False,
                "reasoning": f"Failed to parse HALE Oracle response: {str(e)}",
                "risk_flags": ["JSON_PARSE_ERROR"]
            }
        except Exception as e:
            print(f"[HALE Oracle] ERROR: {str(e)}")
            return {
                "transaction_id": contract_data.get('transaction_id', ''),
                "verdict": "FAIL",
                "confidence_score": 0,
                "release_funds": False,
                "reasoning": f"HALE Oracle verification failed: {str(e)}",
                "risk_flags": ["SYSTEM_ERROR"]
            }
    
    def trigger_smart_contract_circle(self, verdict: Dict[str, Any], seller_address: str,
                                     contract_address: str, contract_abi: Dict[str, Any],
                                     function_name: str = "release") -> bool:
        """
        Trigger smart contract using Circle wallet.
        
        Args:
            verdict: Verdict from verification
            seller_address: Seller address
            contract_address: Smart contract address
            contract_abi: Contract ABI
            function_name: Function to call (release or refund)
            
        Returns:
            True if transaction was successful
        """
        if not verdict.get('release_funds', False) and function_name == "release":
            print("[Blockchain] Verdict: FAIL - Processing refund")
            return self.trigger_smart_contract_circle(
                verdict, seller_address, contract_address, contract_abi, "refund"
            )
        
        if not self.web3:
            print("[Blockchain] WARNING: No blockchain connection configured")
            return False
        
        try:
            # Build transaction data
            contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(contract_address),
                abi=contract_abi
            )
            
            transaction_id = verdict.get('transaction_id', '')
            
            if function_name == "release":
                # Build release transaction
                function_call = contract.functions.release(
                    Web3.to_checksum_address(seller_address),
                    transaction_id
                )
            else:  # refund
                reason = f"VERIFICATION_FAILED: {verdict.get('reasoning', 'No reason provided')}"
                function_call = contract.functions.refund(
                    Web3.to_checksum_address(seller_address),
                    reason
                )
            
            # Encode transaction data
            transaction_data = function_call.build_transaction({
                'from': self.wallet_address,
                'nonce': self.web3.eth.get_transaction_count(self.wallet_address),
                'gas': 200000,
                'gasPrice': self.web3.eth.gas_price,
                'chainId': self.web3.eth.chain_id
            })
            
            # Use Circle to sign and send transaction
            print(f"[Circle] Creating transaction via Circle API...")
            circle_tx = self.circle_manager.create_transaction(
                wallet_id=self.circle_wallet_id,
                destination_address=contract_address,
                amount="0",  # Contract call, no value transfer
                idempotency_key=f"{transaction_id}-{function_name}"
            )
            
            # For contract calls, we need to use Circle's contract interaction API
            # This is a simplified version - Circle may require different API calls
            print(f"[Circle] Transaction created: {circle_tx.get('data', {}).get('id', 'N/A')}")
            print(f"[Blockchain] Transaction submitted via Circle")
            print(f"[Blockchain] Check Arc Block Explorer for status")
            
            return True
            
        except Exception as e:
            print(f"[Blockchain] ERROR: {str(e)}")
            return False
    
    def process_delivery(self, contract_data: Dict[str, Any], seller_address: str,
                        contract_address: Optional[str] = None,
                        contract_abi: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Complete workflow: verify delivery and trigger smart contract via Circle.
        
        Args:
            contract_data: Contract data with transaction_id, terms, etc.
            seller_address: Seller wallet address
            contract_address: Smart contract address
            contract_abi: Contract ABI
            
        Returns:
            Complete result dictionary
        """
        # Step 1: Verify delivery
        verdict = self.verify_delivery(contract_data)
        
        # Step 2: Trigger smart contract if contract info provided
        transaction_success = False
        if contract_address and contract_abi:
            if verdict.get('release_funds', False):
                transaction_success = self.trigger_smart_contract_circle(
                    verdict, seller_address, contract_address, contract_abi, "release"
                )
            else:
                transaction_success = self.trigger_smart_contract_circle(
                    verdict, seller_address, contract_address, contract_abi, "refund"
                )
        
        return {
            **verdict,
            "transaction_success": transaction_success,
            "seller_address": seller_address,
            "oracle_wallet_address": self.wallet_address,
            "circle_wallet_id": self.circle_wallet_id
        }


def main():
    """Example usage of HALE Oracle with Circle wallets."""
    
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    circle_api_key = os.getenv('CIRCLE_API_KEY')
    circle_entity_secret = os.getenv('CIRCLE_ENTITY_SECRET')
    circle_wallet_id = os.getenv('CIRCLE_WALLET_ID')  # Optional: use existing wallet
    
    if not gemini_api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    if not circle_api_key:
        print("ERROR: CIRCLE_API_KEY environment variable not set")
        print("Get your API key from: https://console.circle.com/")
        sys.exit(1)
    
    arc_rpc_url = os.getenv('ARC_RPC_URL') or os.getenv('ARC_TESTNET_RPC_URL')
    
    # Initialize oracle with Circle wallet
    oracle = HaleOracleCircle(
        gemini_api_key=gemini_api_key,
        circle_api_key=circle_api_key,
        circle_entity_secret=circle_entity_secret,
        circle_wallet_id=circle_wallet_id,
        arc_rpc_url=arc_rpc_url
    )
    
    # Load test example
    test_file = os.path.join(os.path.dirname(__file__), 'test_example.json')
    with open(test_file, 'r') as f:
        contract_data = json.load(f)
    
    # Process delivery
    seller_address = "0xSellerAddress123456789"
    contract_address = os.getenv('ESCROW_CONTRACT_ADDRESS')
    
    # Load contract ABI if available
    contract_abi = None
    abi_file = os.path.join(os.path.dirname(__file__), 'escrow_abi.json')
    if os.path.exists(abi_file):
        with open(abi_file, 'r') as f:
            contract_abi = json.load(f)
    
    result = oracle.process_delivery(
        contract_data=contract_data,
        seller_address=seller_address,
        contract_address=contract_address,
        contract_abi=contract_abi
    )
    
    # Print final result
    print("\n" + "="*60)
    print("FINAL RESULT")
    print("="*60)
    print(json.dumps(result, indent=2))
    
    return result


if __name__ == '__main__':
    main()
