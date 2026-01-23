#!/usr/bin/env python3
"""
Verify Circle API Credentials
Helps diagnose authentication issues with Circle API.
"""

import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

def verify_credentials():
    """Verify Circle API credentials and provide diagnostic info."""
    
    api_key = os.getenv("CIRCLE_API_KEY")
    entity_secret = os.getenv("CIRCLE_ENTITY_SECRET")
    
    print("🔍 Circle API Credentials Verification")
    print("=" * 60)
    print()
    
    # Check API key format
    if not api_key:
        print("❌ CIRCLE_API_KEY not set in .env file")
        return False
    
    print(f"✅ CIRCLE_API_KEY found")
    
    # Check format
    parts = api_key.split(':')
    if len(parts) != 3:
        print(f"⚠️  API Key format issue: Expected 3 parts, got {len(parts)}")
        print(f"   Format should be: TEST_API_KEY:key_id:key_secret")
        print(f"   Your key: {api_key[:30]}...")
    else:
        env, key_id, key_secret = parts
        print(f"   Environment: {env}")
        print(f"   Key ID: {key_id[:10]}...")
        print(f"   Key Secret: {'*' * min(len(key_secret), 10)}...")
    
    # Check entity secret
    if not entity_secret:
        print("\n⚠️  CIRCLE_ENTITY_SECRET not set")
        print("   Entity Secret is required for wallet operations")
    else:
        print(f"\n✅ CIRCLE_ENTITY_SECRET found")
        print(f"   Secret: {'*' * min(len(entity_secret), 20)}...")
    
    # Determine environment
    if api_key.startswith("TEST_API_KEY:"):
        base_url = "https://api-sandbox.circle.com"
        env_name = "Sandbox"
    elif api_key.startswith("LIVE_API_KEY:"):
        base_url = "https://api.circle.com"
        env_name = "Production"
    else:
        base_url = "https://api-sandbox.circle.com"
        env_name = "Sandbox (default)"
    
    print(f"\n📍 Environment: {env_name}")
    print(f"   Base URL: {base_url}")
    
    # Test authentication
    print(f"\n🔐 Testing Authentication...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Simple GET request to list wallets
    test_url = f"{base_url}/v1/w3s/wallets"
    print(f"   Testing: GET {test_url}")
    
    try:
        response = requests.get(test_url, headers=headers, timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Authentication successful!")
            data = response.json()
            print(f"   Response: {list(data.keys())}")
            return True
        elif response.status_code == 401:
            error_data = response.json() if response.text else {}
            error_msg = error_data.get('message', 'Invalid credentials')
            print(f"   ❌ Authentication failed: {error_msg}")
            print()
            print("🔧 Troubleshooting Steps:")
            print("   1. Verify API key in Circle Console: https://console.circle.com/")
            print("   2. Check API key is active (not revoked)")
            print("   3. Ensure you're using the correct environment")
            print("   4. Verify API key has 'Wallets' permissions")
            print("   5. Try regenerating the API key")
            return False
        elif response.status_code == 403:
            print("   ⚠️  Permission denied - API key may not have wallet access")
            print("   Check permissions in Circle Console")
            return False
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Network error: {e}")
        return False

if __name__ == "__main__":
    success = verify_credentials()
    sys.exit(0 if success else 1)
