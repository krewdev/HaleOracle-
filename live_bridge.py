import os
import time
import sys
import subprocess
import tempfile
import json
import shutil

# Paths
IN_DIR = "audit_live_test/input"
FRONTEND_BRIDGE_DIR = "frontend/public/pending_reviews"
BRIDGE_INDEX = os.path.join(FRONTEND_BRIDGE_DIR, "index.json")

class StandaloneSandbox:
    def _is_executable_code(self, content: str) -> bool:
        indicators = ['def ', 'import ', 'print(', 'class ', 'if __name__ ==']
        return any(ind in content for ind in indicators)

    def run_sandbox_test(self, code: str):
        wrapped_code = f"""
import sys
import os
import resource

try:
    mem_limit = 256 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem_limit, mem_limit))
    resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
except:
    pass

def block_access(*args, **kwargs):
    print("SANDBOX_SECURITY_VIOLATION", file=sys.stderr)
    os._exit(1)

for func in ['system', 'popen', 'remove', 'unlink', 'rmdir', 'rename']:
    if hasattr(os, func):
        setattr(os, func, block_access)

try:
    exec({json.dumps(code)}, {{"__builtins__": __builtins__, "os": os, "sys": sys}})
except Exception as e:
    print(f"RUNTIME_ERROR: {{e}}", file=sys.stderr)
    sys.exit(1)
"""
        with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as tf:
            tf.write(wrapped_code)
            temp_path = tf.name
        
        try:
            # Clean env
            clean_env = {"PATH": os.environ.get("PATH", "")}
            result = subprocess.run([sys.executable, temp_path], capture_output=True, text=True, timeout=5, env=clean_env)
            
            if result.returncode == 0:
                return {'success': True, 'output': result.stdout[:1000]}
            else:
                return {'success': False, 'error': result.stderr.strip() or "Unknown Error"}
        except subprocess.TimeoutExpired:
            return {'success': False, 'error': "Timeout"}
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

def update_ui_bridge(transaction):
    """Updates the static JSON file that the Frontend reads."""
    try:
        # Read existing
        reviews = []
        if os.path.exists(BRIDGE_INDEX):
            with open(BRIDGE_INDEX, 'r') as f:
                try:
                    reviews = json.load(f)
                except:
                    reviews = []
        
        # Add new
        reviews.insert(0, transaction)
        
        # Save
        with open(BRIDGE_INDEX, 'w') as f:
            json.dump(reviews, f, indent=2)
        print(f"✅ UI Updated: {transaction['id']} added to queue.")
    except Exception as e:
        print(f"❌ Failed to update UI bridge: {e}")

def main():
    if not os.path.exists(IN_DIR):
        os.makedirs(IN_DIR)
        
    oracle = StandaloneSandbox()
    print("👁️  LIVE BRIDGE ACTIVE: Watching for files...")
    
    while True:
        try:
            files = [f for f in os.listdir(IN_DIR) if not f.startswith('.')]
            if not files:
                time.sleep(1)
                continue
            
            for f in files:
                f_path = os.path.join(IN_DIR, f)
                print(f"\n📄 Detected: {f}")
                with open(f_path, 'r') as file:
                    content = file.read()
                
                # Check Sandbox
                res = oracle.run_sandbox_test(content)
                
                # Create review object for UI
                tx_id = f"tx_{int(time.time())}"
                review_obj = {
                    "id": tx_id,
                    "timestamp": time.time(),
                    "status": "pending",
                    "contract_data": {
                        "transaction_id": tx_id,
                        "Delivery_Content": content[:100] + "..."
                    },
                    "ai_verdict": {
                        "verdict": "PENDING_REVIEW" if res['success'] else "FAIL",
                        "confidence_score": 75 if res['success'] else 0, # Borderline if passed sandbox
                        "reasoning": f"Sandbox Result: {'PASS' if res['success'] else 'FAIL - ' + res.get('error')}",
                        "risk_flags": [] if res['success'] else ["RUNTIME_ERROR"]
                    }
                }
                
                print(f"🛡️ Sandbox: {'PASS' if res['success'] else 'FAIL'}")
                update_ui_bridge(review_obj)
                
                os.remove(f_path)
                
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
