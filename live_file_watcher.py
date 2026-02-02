import os
import time
import sys
import json
from hale_oracle_backend import HaleOracle
from dotenv import load_dotenv

# Load real environment variables (important for API key)
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

# DISABLE Simulation Mode to use Real Gemini API
if 'SIMULATION_MODE' in os.environ:
    del os.environ['SIMULATION_MODE']

def main():
    in_dir = "audit_live_test/input"
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in .env")
        return

    try:
        oracle = HaleOracle(api_key)
    except Exception as e:
        print(f"❌ Failed to initialize Oracle: {e}")
        return

    print(f"👁️  LIVE FILE AUDITOR ACTIVE (Using REAL Gemini API)")
    print(f"📂 Watching: {in_dir}")
    print("="*50)
    sys.stdout.flush()
    
    # Create input dir if missing
    if not os.path.exists(in_dir):
        os.makedirs(in_dir)
    
    while True:
        try:
            files = [f for f in os.listdir(in_dir) if not f.startswith('.')]
            if not files:
                time.sleep(1)
                continue
                
            for f in files:
                f_path = os.path.join(in_dir, f)
                print(f"\n📄 [NEW DROP] Detected file: {f}")
                
                try:
                    with open(f_path, 'r') as file:
                        content = file.read()
                except Exception as e:
                    print(f"❌ Error reading file: {e}")
                    continue
                
                # Construct Payload
                tx_id = f"tx_{int(time.time())}_{f}"
                
                data = {
                    "transaction_id": tx_id,
                    "Contract_Terms": "Standard Python Code Delivery. Must be safe and correct.",
                    "Acceptance_Criteria": ["Must run without error", "Must be valid Python"],
                    "Delivery_Content": content
                }
                
                print("🔍 Running HALE Forensic Audit (Calling Gemini)...")
                verdict = oracle.verify_delivery(data)
                
                # Pretty Print Result
                v = verdict['verdict']
                score = verdict['confidence_score']
                
                if v == "PASS":
                    print(f"✅ VERDICT: PASS (Confidence: {score}%)")
                    print("💰 FUNDS RELEASED")
                elif v == "PENDING_REVIEW":
                    print(f"⚠️  VERDICT: PENDING HUMAN REVIEW (Confidence: {score}%)")
                    print("🛑 FUNDS PROTECTED (HITL Queue)")
                else:
                    print(f"❌ VERDICT: FAIL")
                    print("🛑 FUNDS REFUNDED")
                    
                print(f"📝 REASONING: {verdict['reasoning']}")
                if verdict.get('risk_flags'):
                     print(f"🚩 RISK FLAGS: {verdict['risk_flags']}")
                
                print("-" * 50)
                sys.stdout.flush()
                
                # Remove file to reset
                try:
                    os.remove(f_path)
                except:
                    pass
        except Exception as e:
            print(f"Loop Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
