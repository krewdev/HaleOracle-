import os
import time
import sys
from hale_oracle_backend import HaleOracle

def main():
    in_dir = "audit_live_test/input"
    # We init oracle just to get access to the Sandbox method
    try:
        oracle = HaleOracle("dummy_key")
    except:
        # Fallback if init fails due to network checks
        oracle = HaleOracle("dummy_key")
        oracle.simulation_mode = True 

    print(f"👁️  LIVE SANDBOX AUDITOR ACTIVE")
    print(f"⚠️ Note: Network is air-gapped. AI analysis skipped.")
    print(f"🛡️  Focus: REAL-TIME RUNTIME SECURITY CHECK")
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
                
                print("🔍 Analyzing Code Safety...")
                
                # Check 1: Is it python?
                if not oracle._is_executable_code(content):
                    print("ℹ️  Content is not executable code. Skipping Sandbox.")
                else:
                    # Check 2: Run Hardened Sandbox
                    print("🛡️  Spinning up Isolated Sandbox...")
                    start_t = time.time()
                    res = oracle.run_sandbox_test(content)
                    duration = time.time() - start_t
                    
                    if res['success']:
                         print(f"✅ SANDBOX PASSED ({duration:.2f}s)")
                         print(f"   Output: {res['output'].strip()[:200]}...")
                    else:
                         print(f"❌ SANDBOX BLOCKED MALICIOUS/BUGGY CODE ({duration:.2f}s)")
                         print(f"   Reason: {res['error']}")
                         print("🛑 TRANSACTION REJECTED")

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
