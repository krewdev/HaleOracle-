import os
import time
import sys
import subprocess
import tempfile
import json

# Extracted Sandbox Logic from hale_oracle_backend.py to avoid grpc crashes
class StandaloneSandbox:
    def _is_executable_code(self, content: str) -> bool:
        indicators = ['def ', 'import ', 'print(', 'class ', 'if __name__ ==']
        return any(ind in content for ind in indicators)

    def run_sandbox_test(self, code: str):
        wrapped_code = f"""
import sys
import os
import json

# 1. RESOURCE LIMITS
try:
    import resource
    mem_limit = 256 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem_limit, mem_limit))
    resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
except Exception:
    pass

# 2. RUNTIME MONKEYPATCHING
def block_access(*args, **kwargs):
    print("SANDBOX_SECURITY_VIOLATION: Restricted system call blocked.", file=sys.stderr)
    os._exit(1)

DANGEROUS_FUNCTIONS = [
    'system', 'popen', 'spawn', 'execl', 'execle', 'execlp', 'execlpe', 
    'execv', 'execve', 'execvp', 'execvpe', 'fork', 'kill', 'chmod', 
    'chown', 'remove', 'unlink', 'rmdir', 'rename', 'symlink'
]

for func in DANGEROUS_FUNCTIONS:
    if hasattr(os, func):
        setattr(os, func, block_access)

# 3. ISOLATED EXECUTION
try:
    code_to_run = \"\"\"{code.replace('\\', '\\\\').replace('\"', '\\\"')}\"\"\"
    exec(code_to_run, {{"__builtins__": __builtins__, "os": os, "sys": sys}})
except Exception as e:
    print(f"RUNTIME_ERROR: {{type(e).__name__}}: {{e}}", file=sys.stderr)
    sys.exit(1)
"""
        with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as tf:
            tf.write(wrapped_code)
            temp_path = tf.name
        
        try:
            clean_env = {
                "PATH": os.environ.get("PATH", ""),
                "PYTHONPATH": os.environ.get("PYTHONPATH", "")
            }
            
            result = subprocess.run(
                [sys.executable, temp_path],
                capture_output=True,
                text=True,
                timeout=7,
                env=clean_env
            )
            
            stdout = result.stdout[:10000]
            stderr = result.stderr[:10000]

            if result.returncode == 0:
                return {'success': True, 'output': stdout}
            else:
                error_msg = stderr.strip() or "Process exited with non-zero status"
                if "SANDBOX_SECURITY_VIOLATION" in error_msg:
                    return {'success': False, 'error': "Security violation: Blocked system call attempted."}
                return {'success': False, 'error': error_msg}

        except subprocess.TimeoutExpired:
            return {'success': False, 'error': "Execution timed out"}
        except Exception as e:
            return {'success': False, 'error': f"Sandbox System Error: {str(e)}"}
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

def main():
    in_dir = "audit_live_test/input"
    oracle = StandaloneSandbox()

    print(f"👁️  LIVE SANDBOX AUDITOR ACTIVE")
    print(f"🛡️  Engine: Standalone Isolated Process")
    print(f"📂 Watching: {in_dir}")
    print("="*50)
    sys.stdout.flush()
    
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
                
                with open(f_path, 'r') as file:
                    content = file.read()
                
                print("🔍 Analyzing Code Safety...")
                
                if not oracle._is_executable_code(content):
                    print("ℹ️  Content is not executable code. Skipping.")
                else:
                    print("🛡️  Spinning up Isolated Sandbox...")
                    start_t = time.time()
                    res = oracle.run_sandbox_test(content)
                    duration = time.time() - start_t
                    
                    if res['success']:
                         print(f"✅ SANDBOX PASSED ({duration:.2f}s)")
                         print(f"   Output: {res['output'].strip()[:200]}")
                    else:
                         print(f"❌ SANDBOX BLOCKED MALICIOUS/BUGGY CODE ({duration:.2f}s)")
                         print(f"   Reason: {res['error']}")
                         print("🛑 BLOCKED")

                print("-" * 50)
                sys.stdout.flush()
                
                os.remove(f_path)
        except Exception as e:
            print(f"Loop Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
