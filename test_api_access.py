import os
import requests
import json
import google.generativeai as genai

# Test if we can reach Google with custom CERT bundle
os.environ['REQUESTS_CA_BUNDLE'] = '/tmp/cacert.pem'
os.environ['GRPC_DEFAULT_SSL_ROOTS_FILE_PATH'] = '/tmp/cacert.pem'

# User provided Project ID (might be needed for Vertex path, or just context)
# os.environ['GOOGLE_CLOUD_PROJECT'] = 'gen-lang-client-0134269917' 

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    # Try reading from .env manually if env var missing
    try:
        with open('.env') as f:
            for line in f:
                if 'GEMINI_API_KEY' in line:
                    api_key = line.split('=')[1].strip()
                    break
    except:
        pass

print(f"Testing Connectivity (Key: {api_key[:5]}...)...")

try:
    # 1. Test Simple Requests first (REST)
    print("1. Testing REST Reachability...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    res = requests.get(url, timeout=5)
    print(f"REST Status: {res.status_code}")
    if res.status_code == 200:
        print("✅ REST API IS ACCESSIBLE! (Using requests + /tmp/cacert.pem)")
    else:
        print(f"❌ REST Failed: {res.text[:200]}")

    # 2. Test GRPC (SDK)
    print("\n2. Testing GRPC (SDK)...")
    # We must configure genai here
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Hello")
    print(f"✅ SDK SUCCESS: {response.text}")

except Exception as e:
    print(f"❌ Connection Test Failed: {e}")
