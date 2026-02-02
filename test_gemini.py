
import os
import google.generativeai as genai
from dotenv import load_dotenv

import pathlib
env_path = pathlib.Path('.') / '.env.local'
load_dotenv(dotenv_path=env_path)

if env_path.exists():
    print(f".env found at {env_path.absolute()}")
    with open(env_path) as f:
        print("First 5 lines of .env:")
        for i, line in enumerate(f):
            if i < 5:
                print(line.strip())
else:
    print(f".env NOT found at {env_path.absolute()}")

key = os.getenv('GEMINI_API_KEY')
print(f"Key loaded: {key}")
if key:
    print(f"Key masked: {key[:5]}...{key[-5:]}")

try:
    genai.configure(api_key=key)
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Hello")
    print("SUCCESS! Output:", response.text)
except Exception as e:
    print("FAILED:", e)
