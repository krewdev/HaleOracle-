import os
import json
import time
from unittest.mock import MagicMock, patch
from hale_oracle_backend import HaleOracle

def test_hitl_queuing():
    """Verifies that borderline confidence triggers PENDING_REVIEW."""
    print("\n[TEST] Verifying HITL Queuing Logic...")
    
    with patch('hale_oracle_backend.genai') as mock_genai:
        oracle = HaleOracle("mock_key")
        
        # Create a mock response that behaves like a real one
        mock_res = MagicMock()
        # Ensure .text returns the JSON string, and .text.strip() works
        json_str = json.dumps({
            "transaction_id": "tx_hitl_test",
            "verdict": "PASS",
            "confidence_score": 75,
            "release_funds": True,
            "reasoning": "Looks okay but could be better.",
            "risk_flags": []
        })
        mock_res.text = json_str
        
        # Setup the mock client/model to return our mock_res
        if hasattr(oracle, 'client') and oracle.client:
             oracle.client.models.generate_content.return_value = mock_res
        if hasattr(oracle, 'model') and oracle.model:
             oracle.model.generate_content.return_value = mock_res
             
        contract_data = {
            "transaction_id": "tx_hitl_test",
            "Contract_Terms": "Code something",
            "Acceptance_Criteria": ["Runs"],
            "Delivery_Content": "print('hi')"
        }
        
        verdict = oracle.verify_delivery(contract_data)
        
        print(f"Verdict: {verdict.get('verdict')}")
        assert verdict.get('verdict') == 'PENDING_REVIEW'
        assert verdict.get('release_funds') is False
        print("✅ HITL Logic Verification Success.")

def test_sandbox_integration():
    """Verifies that code with errors triggers FAIL."""
    print("\n[TEST] Verifying Sandbox Integration Logic...")
    
    with patch('hale_oracle_backend.genai') as mock_genai:
        oracle = HaleOracle("mock_key")
        
        mock_res = MagicMock()
        json_str = json.dumps({
            "transaction_id": "tx_sandbox_test",
            "verdict": "PASS",
            "confidence_score": 98,
            "release_funds": True,
            "reasoning": "Perfect code!",
            "risk_flags": []
        })
        mock_res.text = json_str
        
        if hasattr(oracle, 'client') and oracle.client:
             oracle.client.models.generate_content.return_value = mock_res
        if hasattr(oracle, 'model') and oracle.model:
             oracle.model.generate_content.return_value = mock_res
             
        contract_data = {
            "transaction_id": "tx_sandbox_test",
            "Contract_Terms": "Code something",
            "Acceptance_Criteria": ["Runs"],
            "Delivery_Content": "import nonexistent_package_hale_oracle"
        }
        
        verdict = oracle.verify_delivery(contract_data)
        
        print(f"Verdict: {verdict.get('verdict')}")
        assert verdict.get('verdict') == 'FAIL'
        assert "RUNTIME_ERROR" in verdict.get('risk_flags', [])
        print("✅ Sandbox Integration Verification Success.")

if __name__ == "__main__":
    try:
        test_hitl_queuing()
        test_sandbox_integration()
        print("\n🚀 ALL SAFEGUARD TESTS PASSED")
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
