from hale_oracle_backend import HaleOracle
import os
from dotenv import load_dotenv

load_dotenv()

def test_sandbox():
    api_key = os.getenv('GEMINI_API_KEY')
    oracle = HaleOracle(api_key)
    
    # Test case 1: Valid code
    code_pass = "def add(a, b): return a + b\nprint(add(5, 5))"
    print(f"Testing valid code...")
    result = oracle.run_sandbox_test(code_pass)
    print(f"Result: {result}")
    
    # Test case 2: Code with error
    code_fail = "print(1/0)"
    print(f"\nTesting code with error...")
    result = oracle.run_sandbox_test(code_fail)
    print(f"Result: {result}")
    
    # Test case 3: Infinite loop
    code_timeout = "while True: pass"
    print(f"\nTesting infinite loop...")
    result = oracle.run_sandbox_test(code_timeout)
    print(f"Result: {result}")

if __name__ == "__main__":
    test_sandbox()
