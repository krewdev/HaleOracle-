from hale_oracle_backend import HaleOracle
import os

def test_hardened_sandbox():
    oracle = HaleOracle("mock_key")
    
    # 1. Test Environment Isolation (Should not see current ENV)
    os.environ['SECRET_KEY_PROBE'] = 'STOLEN_DATA'
    code_env = "import os\nif os.environ.get('SECRET_KEY_PROBE'): print('LEAKED')\nelse: print('ISOLATED')"
    print(f"Testing Environment Isolation...")
    res = oracle.run_sandbox_test(code_env)
    print(f"Result: {res.get('output', '').strip()}")
    
    # 2. Test Syscall Blocking (Should trigger SECURITY_VIOLATION)
    code_sys = "import os\nos.system('echo hacked')"
    print(f"\nTesting System Call Blocking...")
    res = oracle.run_sandbox_test(code_sys)
    print(f"Result Error: {res.get('error')}")
    
    # 3. Test File Access Blocking
    code_file = "import os\nos.remove('hale_oracle_backend.py')"
    print(f"\nTesting File Deletion Blocking...")
    res = oracle.run_sandbox_test(code_file)
    print(f"Result Error: {res.get('error')}")

    # 4. Test Output Capping (Log Bomb)
    code_bomb = "print('A' * 20000)"
    print(f"\nTesting Output Volume Capping...")
    res = oracle.run_sandbox_test(code_bomb)
    print(f"Output Length: {len(res.get('output', ''))} characters")

if __name__ == "__main__":
    test_hardened_sandbox()
