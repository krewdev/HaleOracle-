#!/usr/bin/env python3
"""
HALE Oracle Backend
Integrates with Google Gemini API to verify digital deliveries against contracts
and triggers blockchain transactions on Circle Arc.
HALE (H-A-L-E = 8 in numerology) represents balance and strength.
"""

import json
import os
import sys
from typing import Dict, Any, Optional
try:
    # Try new google.genai package first
    import google.genai as genai
    USE_NEW_API = True
except ImportError:
    # Fallback to deprecated package with warning
    import google.generativeai as genai
    USE_NEW_API = False
    import warnings
    warnings.warn("google.generativeai is deprecated. Install google-genai package for future compatibility.", DeprecationWarning)
from web3 import Web3

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, rely on system environment


class HaleOracle:
    """HALE Oracle that verifies deliveries using Gemini AI."""
    
    def __init__(self, gemini_api_key: str, arc_rpc_url: Optional[str] = None):
        """
        Initialize the HALE Oracle.
        
        Args:
            gemini_api_key: Google Gemini API key
            arc_rpc_url: Optional Circle Arc blockchain RPC URL
        """
        self.gemini_api_key = gemini_api_key
        self.arc_rpc_url = arc_rpc_url
        
        # Configure Gemini
        if USE_NEW_API:
            # New google.genai API
            self.client = genai.Client(api_key=gemini_api_key)
            # Use available model (gemini-2.5-flash or gemini-2.5-pro)
            self.model_name = 'gemini-2.5-flash'  # Fast and available
        else:
            # Legacy google.generativeai API
            genai.configure(api_key=gemini_api_key)
            # Try available models in order of preference
            try:
                # Try newer models first
                available_models = [m.name for m in genai.list_models() 
                                  if 'generateContent' in m.supported_generation_methods]
                # Remove 'models/' prefix and select best available
                model_preferences = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-pro']
                self.model_name = 'gemini-2.5-flash'  # Default to latest
                for pref in model_preferences:
                    if f'models/{pref}' in available_models:
                        self.model_name = pref
                        break
            except Exception as e:
                # Fallback if list_models fails
                print(f"Warning: Could not list models, using default: {e}")
                self.model_name = 'gemini-2.5-flash'  # Use latest as default
        
        # Load system prompt
        system_prompt_path = os.path.join(
            os.path.dirname(__file__), 
            'hale_oracle_system_prompt.txt'
        )
        with open(system_prompt_path, 'r') as f:
            self.system_prompt = f.read()
        
        # Initialize Gemini model with system instructions
        if USE_NEW_API:
            # New API - model is accessed via client
            self.model = self.model_name
        else:
            # Legacy API - use gemini-pro (compatible with v1beta)
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=self.system_prompt
            )
        
        # Initialize Web3 if RPC URL provided
        self.web3 = None
        if arc_rpc_url:
            try:
                self.web3 = Web3(Web3.HTTPProvider(arc_rpc_url, request_kwargs={'timeout': 10}))
                if not self.web3.is_connected():
                    print("Warning: Could not connect to Arc blockchain")
            except Exception as e:
                print(f"Warning: Could not connect to Arc blockchain: {e}")
                self.web3 = None
    
    def format_verification_request(self, contract_data: Dict[str, Any]) -> str:
        """
        Format the contract data into a prompt for Gemini.
        
        Args:
            contract_data: Dictionary containing transaction_id, Contract_Terms,
                          Acceptance_Criteria, and Delivery_Content
        """
        acceptance_criteria = contract_data.get('Acceptance_Criteria', [])
        criteria_text = '\n'.join([f"  - {criterion}" for criterion in acceptance_criteria])
        
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
        """
        Verify a delivery against contract terms using Gemini.
        
        Args:
            contract_data: Dictionary containing transaction_id, Contract_Terms,
                          Acceptance_Criteria, and Delivery_Content
                          
        Returns:
            Dictionary containing verdict, confidence_score, release_funds, etc.
        """
        print(f"[HALE Oracle] Analyzing delivery for transaction: {contract_data.get('transaction_id', 'unknown')}")
        print(f"[HALE Oracle] Contract Terms: {contract_data.get('Contract_Terms', '')[:100]}...")
        
        # Format the request
        user_prompt = self.format_verification_request(contract_data)
        
        try:
            # Send to Gemini
            print("[HALE Oracle] Sending delivery to HALE Oracle (Gemini)...")
            
            if USE_NEW_API:
                # New google.genai API
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config={'system_instruction': self.system_prompt}
                )
                response_text = response.text.strip()
            else:
                # Legacy google.generativeai API
                response = self.model.generate_content(user_prompt)
                response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                # Find the JSON part
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    response_text = response_text[json_start:json_end]
            
            # Parse JSON
            verdict = json.loads(response_text)
            
            print(f"[HALE Oracle] Verdict: {verdict.get('verdict', 'UNKNOWN')}")
            print(f"[HALE Oracle] Confidence: {verdict.get('confidence_score', 0)}%")
            print(f"[HALE Oracle] Reasoning: {verdict.get('reasoning', 'N/A')}")
            
            if verdict.get('risk_flags'):
                print(f"[HALE Oracle] Risk Flags: {', '.join(verdict.get('risk_flags', []))}")
            
            return verdict
            
        except json.JSONDecodeError as e:
            print(f"[HALE Oracle] ERROR: Failed to parse JSON response: {e}")
            print(f"[HALE Oracle] Raw response: {response_text[:500]}")
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
    
    def trigger_smart_contract(self, verdict: Dict[str, Any], seller_address: str, 
                               contract_address: Optional[str] = None) -> bool:
        """
        Trigger the smart contract to release or refund funds based on verdict.
        
        Args:
            verdict: The verdict dictionary from verify_delivery
            seller_address: The seller's wallet address
            contract_address: Optional smart contract address
            
        Returns:
            True if transaction was successful, False otherwise
        """
        if not verdict.get('release_funds', False):
            print("[Blockchain] Verdict: FAIL - Processing refund to buyer")
            return self._refund_funds(seller_address, verdict, contract_address)
        
        if not self.web3:
            print("[Blockchain] WARNING: No blockchain connection configured")
            print(f"[Blockchain] Would trigger: Escrow.release({seller_address})")
            return False
        
        print(f"[Blockchain] Triggering Smart Contract: Escrow.release({seller_address})...")
        
        # TODO: Implement actual smart contract interaction
        # Example structure:
        # contract = self.web3.eth.contract(address=contract_address, abi=escrow_abi)
        # tx = contract.functions.release(seller_address).build_transaction({
        #     'from': self.web3.eth.accounts[0],
        #     'gas': 100000,
        #     'gasPrice': self.web3.eth.gas_price
        # })
        # signed_tx = self.web3.eth.account.sign_transaction(tx, private_key)
        # tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        # print(f"[Blockchain] Transaction hash: {tx_hash.hex()}")
        
        print("[Blockchain] Transaction would be submitted here")
        print("[Blockchain] Check Arc Block Explorer for transaction status")
        
        return True
    
    def _refund_funds(self, seller_address: str, verdict: Dict[str, Any],
                     contract_address: Optional[str] = None) -> bool:
        """
        Refund funds back to buyer when verification fails.
        
        Args:
            seller_address: The seller's address (funds were deposited for this seller)
            verdict: The verdict dictionary with reasoning
            contract_address: Optional smart contract address
            
        Returns:
            True if refund transaction was successful, False otherwise
        """
        if not self.web3:
            print("[Blockchain] WARNING: No blockchain connection configured")
            print(f"[Blockchain] Would trigger: ArcFuseEscrow.refund({seller_address})")
            return False
        
        print(f"[Blockchain] Triggering Smart Contract: ArcFuseEscrow.refund({seller_address})...")
        
        # TODO: Implement actual smart contract interaction
        # Example structure:
        # contract = self.web3.eth.contract(address=contract_address, abi=escrow_abi)
        # reason = f"VERIFICATION_FAILED: {verdict.get('reasoning', 'No reason provided')}"
        # tx = contract.functions.refund(seller_address, reason).build_transaction({...})
        # signed_tx = self.web3.eth.account.sign_transaction(tx, private_key)
        # tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        # print(f"[Blockchain] Refund transaction hash: {tx_hash.hex()}")
        
        print("[Blockchain] Refund transaction would be submitted here")
        print("[Blockchain] Check Arc Block Explorer for transaction status")
        
        return True
    
    def process_delivery(self, contract_data: Dict[str, Any], 
                       seller_address: str) -> Dict[str, Any]:
        """
        Complete workflow: verify delivery and trigger smart contract.
        
        Args:
            contract_data: Dictionary containing transaction_id, Contract_Terms,
                          Acceptance_Criteria, and Delivery_Content
            seller_address: The seller's wallet address
                          
        Returns:
            Complete result dictionary with verdict and transaction status
        """
        # Step 1: Verify delivery
        verdict = self.verify_delivery(contract_data)
        
        # Step 2: Trigger smart contract if passed
        transaction_success = False
        if verdict.get('release_funds', False):
            transaction_success = self.trigger_smart_contract(
                verdict, 
                seller_address
            )
        
        return {
            **verdict,
            "transaction_success": transaction_success,
            "seller_address": seller_address
        }


def main():
    """Example usage of HALE Oracle."""
    
    # Get API key from environment
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        print("Get your API key from: https://aistudio.google.com/apikey")
        sys.exit(1)
    
    # Optional: Arc blockchain RPC URL
    arc_rpc_url = os.getenv('ARC_RPC_URL')  # e.g., "https://rpc.arc.xyz"
    
    # Initialize oracle
    oracle = HaleOracle(gemini_api_key, arc_rpc_url)
    
    # Load test example
    test_file = os.path.join(os.path.dirname(__file__), 'test_example.json')
    with open(test_file, 'r') as f:
        contract_data = json.load(f)
    
    # Process delivery
    seller_address = "0xSellerAddress123456789"  # Replace with actual address
    result = oracle.process_delivery(contract_data, seller_address)
    
    # Print final result
    print("\n" + "="*60)
    print("FINAL RESULT")
    print("="*60)
    print(json.dumps(result, indent=2))
    
    return result


if __name__ == '__main__':
    main()
