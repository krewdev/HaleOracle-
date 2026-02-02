import os
from dotenv import load_dotenv
load_dotenv()
print(f"API KEY EXISTS: {bool(os.getenv('GEMINI_API_KEY'))}")
if os.getenv('GEMINI_API_KEY'):
    print(f"START: {os.getenv('GEMINI_API_KEY')[:5]}...")
