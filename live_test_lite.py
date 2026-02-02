import os
import json
import time
import requests
import subprocess
import tempfile
import sys
from dotenv import load_dotenv

# We implement a "Lightweight" version of the Oracle for this walkthrough
# to avoid the gRPC/SDK permission issues in this specific environment.
class LightOracle:
    def __init__(self, api_key):
        self.api_key = api_key
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    def verify(self, contract_data):
        prompt = f"""
        You are HALE Oracle. Return JSON ONLY.
        Terms: {contract_data['Contract_Terms']}
        Criteria: {contract_data['Acceptance_Criteria']}
        Code: {contract_data['Delivery_Content']}
        
        Protocol: Any security risk or unmet criteria = FAIL.
        Output Schema: {{"verdict": "PASS"|"FAIL", "confidence_score": 0-100, "release_funds": bool, "reasoning": "...", "risk_flags": []}}
        """
        
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {'Content-Type': 'application/json'}
        
        response = requests.post(self.url, json=payload, headers=headers)
        data = response.json()
        text = data['candidates'][0]['content']['parts'][0]['text']
        
        # Clean JSON
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
             text = text.split("```")[1].split("```")[0]
             
        verdict = json.loads(text.strip())
        
        # --- SAFEGUARD: SANDBOX ---
        if verdict['verdict'] == 'PASS' and "def " in contract_data['Delivery_Content']:
             print("[HALE] Verifying code in sandbox...")
             with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as tf:
                 tf.write(contract_data['Delivery_Content'])
                 tmp = tf.name
             
             try:
                 res = subprocess.run([sys.executable, tmp], capture_output=True, text=True, timeout=3)
                 if res.returncode != 0:
                      verdict['verdict'] = 'FAIL'
                      verdict['reasoning'] += f"\nSANDBOX OVERRIDE: Code crashed with: {res.stderr}"
                      verdict['risk_flags'].append("RUNTIME_ERROR")
             except Exception as e:
                  verdict['verdict'] = 'FAIL'
                  verdict['reasoning'] += f"\nSANDBOX OVERRIDE: {str(e)}"
             finally:
                  os.unlink(tmp)
        
        # --- SAFEGUARD: HITL ---
        if 70 <= verdict['confidence_score'] < 90 and verdict['verdict'] == 'PASS':
             print("[HALE] Borderline confidence detected. Moving to HITL Queue.")
             verdict['verdict'] = 'PENDING_REVIEW'
             verdict['release_funds'] = False
             
        return verdict

def main():
    load_dotenv()
    api_key = "AIzaSyCwZ9t1u3zIYZWfLc6SbGkwOerSMXgnAjw" # Using the key from your .env
    oracle = LightOracle(api_key)

    print("\n🚀 STARTING LIVE WALKTHROUGH (Simplified Environment)")
    
    # CASE: Broken Code that AI might think is fine
    case = {
        "Contract_Terms": "Create a function to calculate factorial of 5.",
        "Acceptance_Criteria": ["Must use Python", "Must return 120"],
        "Delivery_Content": "def factorial(n):\n    return n * factorial(n-1)  # Missing base case! AI logic might miss this.\n\nprint(factorial(5))"
    }
    
    print("\nTesting 'Infinite Recursion' delivery...")
    res = oracle.verify(case)
    print(f"VERDICT: {res['verdict']}")
    print(f"REASONING: {res['reasoning']}")
    print(f"RISK FLAGS: {res.get('risk_flags', [])}")

if __name__ == "__main__":
    main()
