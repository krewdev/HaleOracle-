#!/usr/bin/env python3
"""
Circle Wallet Manager
Manages Circle Programmable Wallets for HALE Oracle operations.
Uses Circle's API to create and control wallets programmatically.
"""

import os
import sys
import requests
from typing import Dict, Any, Optional, List
from web3 import Web3

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv not installed, try to load manually
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()


class CircleWalletManager:
    """Manages Circle Programmable Wallets via API."""
    
    def __init__(self, api_key: str, entity_secret: Optional[str] = None):
        """
        Initialize Circle Wallet Manager.
        
        Args:
            api_key: Circle API key
            entity_secret: Circle entity secret (for wallet creation)
        """
        self.api_key = api_key
        self.entity_secret = entity_secret
        
        # Determine API base URL based on API key prefix
        # Circle API key format: TEST_API_KEY:key_id:key_secret or LIVE_API_KEY:key_id:key_secret
        if api_key.startswith("TEST_API_KEY:"):
            self.base_url = "https://api-sandbox.circle.com"
            self.environment = "sandbox"
        elif api_key.startswith("LIVE_API_KEY:"):
            self.base_url = "https://api.circle.com"
            self.environment = "production"
        else:
            # Default to sandbox for testing
            self.base_url = "https://api-sandbox.circle.com"
            self.environment = "sandbox"
        
        # Circle Programmable Wallets API uses /v1/w3s prefix
        # Correct endpoint is /v1/w3s/wallets (not /v1/w3s/developer/wallets)
        self.w3s_base_url = f"{self.base_url}/v1/w3s"
        
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def create_wallet(self, idempotency_key: str, description: str = "HALE Oracle Wallet") -> Dict[str, Any]:
        """
        Create a new Circle Programmable Wallet.
        
        Args:
            idempotency_key: Unique key for idempotent requests
            description: Description for the wallet
            
        Returns:
            Dictionary with wallet information including walletId and address
        """
        if not self.entity_secret:
            raise ValueError("Entity secret required for wallet creation")
        
        # Circle Programmable Wallets API endpoint
        # Note: Endpoint is /v1/w3s/wallets (not /developer/wallets)
        url = f"{self.w3s_base_url}/wallets"
        payload = {
            "idempotencyKey": idempotency_key,
            "description": description
        }
        
        headers = {
            **self.headers,
            "X-User-Token": self.entity_secret
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 401:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get('message', 'Invalid credentials')
                raise ValueError(
                    f"Authentication failed (401): {error_msg}\n"
                    f"Please verify:\n"
                    f"1. Your API key is correct and active\n"
                    f"2. Your Entity Secret is correct\n"
                    f"3. Your API key has wallet creation permissions\n"
                    f"4. You're using the correct environment (sandbox vs production)"
                )
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP Error {response.status_code}"
            try:
                error_data = response.json()
                error_msg = error_data.get('message', error_msg)
            except:
                error_msg = response.text[:200] if hasattr(response, 'text') else str(e)
            
            print(f"❌ Error creating wallet: {error_msg}")
            print(f"   URL: {url}")
            print(f"   Status: {response.status_code}")
            raise ValueError(f"Failed to create wallet: {error_msg}")
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Network error: {str(e)}")
    
    def get_wallet(self, wallet_id: str) -> Dict[str, Any]:
        """
        Get wallet information.
        
        Args:
            wallet_id: Circle wallet ID
            
        Returns:
            Wallet information
        """
        url = f"{self.w3s_base_url}/wallets/{wallet_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_wallet_addresses(self, wallet_id: str) -> List[Dict[str, Any]]:
        """
        Get all addresses for a wallet.
        
        Args:
            wallet_id: Circle wallet ID
            
        Returns:
            List of addresses associated with the wallet
        """
        url = f"{self.w3s_base_url}/wallets/{wallet_id}/addresses"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        result = response.json()
        return result.get("data", [])
    
    def create_address(self, wallet_id: str, blockchain: str = "ARC", 
                      idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new address for a wallet on a specific blockchain.
        
        Args:
            wallet_id: Circle wallet ID
            blockchain: Blockchain to create address on (ARC, ETH, etc.)
            idempotency_key: Unique key for idempotent requests
            
        Returns:
            Address information
        """
        if not self.entity_secret:
            raise ValueError("Entity secret required for address creation")
        
        url = f"{self.w3s_base_url}/wallets/{wallet_id}/addresses"
        payload = {
            "blockchain": blockchain,
            "idempotencyKey": idempotency_key or f"{wallet_id}-{blockchain}-{os.urandom(8).hex()}"
        }
        
        headers = {
            **self.headers,
            "X-User-Token": self.entity_secret
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    
    def get_balance(self, wallet_id: str, token_address: Optional[str] = None) -> Dict[str, Any]:
        """
        Get wallet balance.
        
        Args:
            wallet_id: Circle wallet ID
            token_address: Optional token address (None for native token)
            
        Returns:
            Balance information
        """
        url = f"{self.w3s_base_url}/wallets/{wallet_id}/balances"
        params = {}
        if token_address:
            params["tokenAddress"] = token_address
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def create_transaction(self, wallet_id: str, destination_address: str, 
                          amount: str, token_id: Optional[str] = None,
                          idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a transaction from a Circle wallet.
        
        Args:
            wallet_id: Circle wallet ID
            destination_address: Destination address
            amount: Amount to send (in wei/smallest unit)
            token_id: Optional token ID (None for native token)
            idempotency_key: Unique key for idempotent requests
            
        Returns:
            Transaction information
        """
        if not self.entity_secret:
            raise ValueError("Entity secret required for transactions")
        
        url = f"{self.w3s_base_url}/wallets/{wallet_id}/transactions"
        payload = {
            "idempotencyKey": idempotency_key or f"{wallet_id}-{os.urandom(8).hex()}",
            "destination": {
                "type": "address",
                "address": destination_address
            },
            "amount": {
                "amount": amount,
                "currency": "USDC" if not token_id else token_id
            }
        }
        
        if token_id:
            payload["tokenId"] = token_id
        
        headers = {
            **self.headers,
            "X-User-Token": self.entity_secret
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    
    def get_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """
        Get transaction status.
        
        Args:
            transaction_id: Transaction ID
            
        Returns:
            Transaction information
        """
        url = f"{self.w3s_base_url}/transactions/{transaction_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def sign_transaction(self, wallet_id: str, transaction_data: Dict[str, Any],
                        idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Sign a transaction using Circle's signing service.
        
        Args:
            wallet_id: Circle wallet ID
            transaction_data: Transaction data (from create_transaction or custom)
            idempotency_key: Unique key for idempotent requests
            
        Returns:
            Signed transaction information
        """
        if not self.entity_secret:
            raise ValueError("Entity secret required for signing")
        
        url = f"{self.w3s_base_url}/wallets/{wallet_id}/transactions"
        payload = {
            **transaction_data,
            "idempotencyKey": idempotency_key or f"{wallet_id}-sign-{os.urandom(8).hex()}"
        }
        
        headers = {
            **self.headers,
            "X-User-Token": self.entity_secret
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()


def get_wallet_address_for_web3(wallet_manager: CircleWalletManager, 
                                 wallet_id: str, blockchain: str = "ARC") -> str:
    """
    Get the wallet address for use with Web3.
    
    Args:
        wallet_manager: CircleWalletManager instance
        wallet_id: Circle wallet ID
        blockchain: Blockchain to get address for
        
    Returns:
        Wallet address string
    """
    addresses = wallet_manager.get_wallet_addresses(wallet_id)
    
    # Find address for the specified blockchain
    for addr_info in addresses:
        if addr_info.get("blockchain") == blockchain:
            return addr_info.get("address")
    
    # If no address exists, create one
    new_address = wallet_manager.create_address(wallet_id, blockchain)
    return new_address.get("data", {}).get("address")


if __name__ == "__main__":
    # Example usage
    api_key = os.getenv("CIRCLE_API_KEY")
    entity_secret = os.getenv("CIRCLE_ENTITY_SECRET")
    
    if not api_key:
        print("Error: CIRCLE_API_KEY not set")
        print("Please set CIRCLE_API_KEY in your .env file")
        print("Get your API key from: https://console.circle.com/")
        sys.exit(1)
    
    if not entity_secret:
        print("Warning: CIRCLE_ENTITY_SECRET not set")
        print("Wallet creation and transactions require entity secret")
        print("Get it from: https://console.circle.com/")
    
    manager = CircleWalletManager(api_key, entity_secret)
    
    # Create a wallet
    wallet = manager.create_wallet(
        idempotency_key=f"hale-oracle-{os.urandom(8).hex()}",
        description="HALE Oracle Main Wallet"
    )
    
    wallet_id = wallet.get("data", {}).get("walletId")
    print(f"Created wallet: {wallet_id}")
    
    # Get or create ARC address
    address = get_wallet_address_for_web3(manager, wallet_id, "ARC")
    print(f"ARC Address: {address}")
