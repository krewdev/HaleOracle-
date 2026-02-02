import os
import json
import time
from hale_oracle_backend import HaleOracle
from dotenv import load_dotenv

# Load real environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

def run_live_walkthrough():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in .env")
        return

    oracle = HaleOracle(api_key)
    
    print("\n" + "="*60)
    print("🚀 HALE ORACLE: LIVE SAFEGUARD WALKTHROUGH")
    print("="*60)
    print("\nIn this test, we will submit three types of deliveries to see how the HALE safeguards react.")

    # --- SCENARIO 1: THE "PERFECT" DELIVERY ---
    print("\n" + "-"*40)
    print("🔹 SCENARIO 1: High-Confidence Pass")
    print("Goal: Verify that a clean, working delivery flows through automatically.")
    
    perfect_delivery = {
        "transaction_id": f"tx_perfect_{int(time.time())}",
        "Contract_Terms": "Create a Python function that adds two numbers and returns the result.",
        "Acceptance_Criteria": ["Must be a function named 'add'", "Must handle integers", "Must return the sum"],
        "Delivery_Content": "def add(a, b):\n    return int(a) + int(b)\n\n# Verification test\nresult = add(10, 20)\nprint(f\"Test Sum: {result}\")"
    }
    
    result1 = oracle.verify_delivery(perfect_delivery)
    print(f"VERDICT: {result1['verdict']}")
    print(f"CONFIDENCE: {result1['confidence_score']}%")
    print(f"REASONING Snippet: {result1['reasoning'][:100]}...")

    # --- SCENARIO 2: THE "AI-TRICKER" (Sandbox Safeguard) ---
    print("\n" + "-"*40)
    print("🔹 SCENARIO 2: The 'AI-Tricker' (Broken Code)")
    print("Goal: Submit code that LOOKS correct to the AI audit, but fails at RUNTIME.")
    
    tricky_delivery = {
        "transaction_id": f"tx_tricky_{int(time.time())}",
        "Contract_Terms": "Create a script that lists the first 5 elements of a list.",
        "Acceptance_Criteria": ["Must use Python", "Must handle a list of length 3 without crashing"],
        "Delivery_Content": "def list_elements(data):\n    # This looks correct to AI logic, but will fail if list is too short\n    for i in range(5):\n        print(data[i])\n\n# The seller says it works, but didn't handle IndexErrors\nlist_elements([1, 2, 3])"
    }

    print("Running audit...")
    result2 = oracle.verify_delivery(tricky_delivery)
    print(f"VERDICT: {result2['verdict']}")
    print(f"REASONING: {result2['reasoning']}")
    print(f"RISK FLAGS: {result2.get('risk_flags', [])}")
    print("\n✨ NOTICE: Even if the AI thought the code 'seemed' logical, the SANDBOX caught the IndexError and blocked the payment!")

    # --- SCENARIO 3: THE "BORDERLINE" (HITL Safeguard) ---
    print("\n" + "-"*40)
    print("🔹 SCENARIO 3: Borderline Confidence (HITL Queue)")
    print("Goal: Submit code that is functional but slightly messy or ambiguous, causing AI confidence to drop.")
    
    borderline_delivery = {
        "transaction_id": f"tx_hitl_{int(time.time())}",
        "Contract_Terms": "Create a script to calculate area of a circle. Use pi = 3.14.",
        "Acceptance_Criteria": ["Must calculate area correctly", "Must use a variable for radius"],
        "Delivery_Content": "import math\nr = 5\n# Note: Seller used math.pi instead of the requested 3.14 exactly.\na = math.pi * r**2\nprint(a)"
    }

    print("Running audit...")
    result3 = oracle.verify_delivery(borderline_delivery)
    print(f"VERDICT: {result3['verdict']}")
    print(f"CONFIDENCE: {result3['confidence_score']}%")
    
    if result3['verdict'] == 'PENDING_REVIEW':
        print("\n⏳ STATUS: This transaction has been moved to the HUMAN FORENSIC AUDIT queue.")
        print("Check your 'Oracle Monitor' dashboard to manually approve or reject this delivery.")
    else:
        print(f"Status: {result3['verdict']}")

    print("\n" + "="*60)
    print("✅ WALKTHROUGH COMPLETE")
    print("="*60)

if __name__ == "__main__":
    run_live_walkthrough()
