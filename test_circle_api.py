#!/usr/bin/env python3
"""
Test Circle API Connection
Helps debug Circle API connectivity and endpoint issues.
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_circle_api():
    """Test Circle API connection and endpoints."""
    
    api_key = os.getenv("CIRCLE_API_KEY")
    entity_secret = os.getenv("CIRCLE_ENTITY_SECRET")
    
    if not api_key:
        print("❌ CIRCLE_API_KEY not set in .env")
        return False
    
    print(f"✅ API Key found: {api_key[:20]}...")
    
    if not entity_secret:
        print("⚠️  CIRCLE_ENTITY_SECRET not set (required for wallet operations)")
    
    # Determine base URL
    if api_key.startswith("TEST_API_KEY:"):
        base_url = "https://api-sandbox.circle.com"
        print(f"📍 Using Sandbox environment")
    elif api_key.startswith("LIVE_API_KEY:"):
        base_url = "https://api.circle.com"
        print(f"📍 Using Production environment")
    else:
        base_url = "https://api-sandbox.circle.com"
        print(f"📍 Using Sandbox environment (default)")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    if entity_secret:
        headers["X-User-Token"] = entity_secret
    
    print(f"\n🔍 Testing API endpoints...")
    print(f"Base URL: {base_url}")
    
    # Test 1: Check API health/status
    print("\n1. Testing API health...")
    try:
        # Try common health check endpoints
        test_urls = [
            f"{base_url}/v1/w3s/developer/wallets",
            f"{base_url}/v1/w3s/wallets",
            f"{base_url}/v1/w3s",
            f"{base_url}/v1",
        ]
        
        for url in test_urls:
            try:
                response = requests.get(url, headers=headers, timeout=5)
                print(f"   {url}: {response.status_code}")
                if response.status_code != 404:
                    print(f"   ✅ Found working endpoint: {url}")
                    print(f"   Response: {response.text[:200]}")
                    break
            except Exception as e:
                print(f"   {url}: Error - {str(e)[:50]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Try to list wallets (if endpoint exists)
    print("\n2. Testing wallet list endpoint...")
    test_endpoints = [
        f"{base_url}/v1/w3s/developer/wallets",
        f"{base_url}/v1/w3s/wallets",
    ]
    
    for endpoint in test_endpoints:
        try:
            response = requests.get(endpoint, headers=headers, timeout=5)
            print(f"   {endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ Success! Endpoint works: {endpoint}")
                data = response.json()
                print(f"   Response keys: {list(data.keys())}")
                return True
            elif response.status_code == 401:
                print(f"   ⚠️  Authentication issue - check API key")
            elif response.status_code == 403:
                print(f"   ⚠️  Permission denied - check entity secret")
            else:
                print(f"   Response: {response.text[:200]}")
        except Exception as e:
            print(f"   Error: {str(e)[:100]}")
    
    print("\n💡 Tips:")
    print("   - Verify your API key format: TEST_API_KEY:... or LIVE_API_KEY:...")
    print("   - Check Circle Console: https://console.circle.com/")
    print("   - Review Circle API docs: https://developers.circle.com/")
    print("   - Make sure you're using the correct environment (sandbox vs production)")
    
    return False

if __name__ == "__main__":
    test_circle_api()
