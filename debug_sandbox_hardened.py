import os
import sys
import subprocess
import tempfile
import time
from typing import Dict, Any

class MockOracle:
    def run_sandbox_test(self, code: str) -> Dict[str, Any]:
        """Copied logic from hale_oracle_backend.py for isolation testing."""
        wrapped_code = f"""
import sys
import os
import json

try:
    import resource
    mem_limit = 256 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem_limit, mem_limit))
    resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
except Exception:
    pass

def block_access(*args, **kwargs):
    print("SANDBOX_SECURITY_VIOLATION: Restricted system call blocked.", file=sys.stderr)
    os._exit(1)

for func in ['system', 'popen', 'remove', 'unlink', 'rmdir', 'rename']:
    if hasattr(os, func):
        setattr(os, func, block_access)

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
            return {'success': False, 'error': str(e)}
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

def run_tests():
    oracle = MockOracle()
    
    print("1. Testing Environment Isolation...")
    os.environ['SECRET_KEY_PROBE'] = 'STOLEN_DATA'
    res = oracle.run_sandbox_test("import os\nprint('LEAKED' if os.environ.get('SECRET_KEY_PROBE') else 'ISOLATED')")
    print(f"   Result: {res.get('output', '').strip()}")
    
    print("\n2. Testing System Call Blocking...")
    res = oracle.run_sandbox_test("import os\nos.system('echo hacked')")
    print(f"   Result Error: {res.get('error')}")
    
    print("\n3. Testing Output Capping...")
    res = oracle.run_sandbox_test("print('A' * 20000)")
    print(f"   Result Output Length: {len(res.get('output', ''))} chars")

if __name__ == "__main__":
    run_tests()
