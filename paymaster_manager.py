#!/usr/bin/env python3
"""
Paymaster Manager for HALE Oracle
Handles gasless transactions using paymaster contracts
"""

import os
import json
from typing import Dict, Any, Optional
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()


class PaymasterManager:
    """Manages paymaster interactions for gasless oracle transactions."""
    
    def __init__(self, web3: Web3, paymaster_address: str, paymaster_abi: Dict[str, Any]):
        """
        Initialize Paymaster Manager.
        
        Args:
            web3: Web3 instance connected to blockchain
            paymaster_address: Paymaster contract address
            paymaster_abi: Paymaster contract ABI
        """
        self.web3 = web3
        self.paymaster_address = Web3.to_checksum_address(paymaster_address)
        self.paymaster = web3.eth.contract(
            address=self.paymaster_address,
            abi=paymaster_abi
        )
    
    def sponsor_transaction(
        self,
        oracle_address: str,
        target_contract: str,
        function_name: str,
        function_args: tuple,
        contract_abi: Dict[str, Any],
        gas_limit: int = 200000
    ) -> Dict[str, Any]:
        """
        Sponsor a transaction through paymaster.
        
        Args:
            oracle_address: Oracle address (must be authorized)
            target_contract: Target contract address
            function_name: Function to call
            function_args: Function arguments
            contract_abi: Target contract ABI
            gas_limit: Gas limit for transaction
            
        Returns:
            Dictionary with transaction result
        """
        try:
            # Build target contract call
            target = self.web3.eth.contract(
                address=Web3.to_checksum_address(target_contract),
                abi=contract_abi
            )
            
            # Encode function call
            function_call = getattr(target.functions, function_name)(*function_args)
            data = function_call._encode_transaction_data()
            
            # Call paymaster sponsorTransaction
            print(f"[Paymaster] Sponsoring transaction for oracle {oracle_address}...")
            print(f"[Paymaster] Target: {target_contract}, Function: {function_name}")
            
            # Get oracle account (for signing if needed)
            oracle_key = os.getenv('ORACLE_PRIVATE_KEY')
            if not oracle_key:
                raise ValueError("ORACLE_PRIVATE_KEY not set")
            
            oracle_account = Account.from_key(oracle_key)
            
            # Build paymaster transaction
            nonce = self.web3.eth.get_transaction_count(oracle_account.address)
            gas_price = self.web3.eth.gas_price
            
            tx = self.paymaster.functions.sponsorTransaction(
                Web3.to_checksum_address(target_contract),
                data,
                gas_limit
            ).build_transaction({
                'from': oracle_account.address,
                'nonce': nonce,
                'gas': 300000,  # Gas for paymaster call
                'gasPrice': gas_price,
                'chainId': self.web3.eth.chain_id
            })
            
            # Sign and send
            signed_tx = oracle_account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            print(f"[Paymaster] Transaction submitted: {tx_hash.hex()}")
            
            # Wait for confirmation
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                print(f"[Paymaster] ✅ Transaction sponsored successfully!")
                print(f"[Paymaster] Gas used: {receipt.gasUsed}")
                return {
                    'success': True,
                    'tx_hash': tx_hash.hex(),
                    'gas_used': receipt.gasUsed,
                    'block_number': receipt.blockNumber
                }
            else:
                print(f"[Paymaster] ❌ Transaction failed")
                return {
                    'success': False,
                    'tx_hash': tx_hash.hex(),
                    'error': 'Transaction reverted'
                }
                
        except Exception as e:
            print(f"[Paymaster] ERROR: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def check_balance(self) -> int:
        """Check paymaster total balance."""
        try:
            balance = self.paymaster.functions.totalBalance().call()
            return balance
        except Exception as e:
            print(f"[Paymaster] Error checking balance: {e}")
            return 0
    
    def is_oracle_authorized(self, oracle_address: str) -> bool:
        """Check if oracle is authorized."""
        try:
            return self.paymaster.functions.isOracleAuthorized(
                Web3.to_checksum_address(oracle_address)
            ).call()
        except Exception as e:
            print(f"[Paymaster] Error checking authorization: {e}")
            return False
    
    def get_paymaster_info(self) -> Dict[str, Any]:
        """Get paymaster information."""
        try:
            info = self.paymaster.functions.getPaymasterInfo().call()
            return {
                'balance': info[0],
                'max_gas': info[1],
                'owner': info[2]
            }
        except Exception as e:
            print(f"[Paymaster] Error getting info: {e}")
            return {}


class RelayPaymasterManager:
    """Manages relay paymaster interactions."""
    
    def __init__(self, web3: Web3, paymaster_address: str, paymaster_abi: Dict[str, Any], relayer_key: str):
        """
        Initialize Relay Paymaster Manager.
        
        Args:
            web3: Web3 instance
            paymaster_address: Relay paymaster contract address
            paymaster_abi: Relay paymaster contract ABI
            relayer_key: Relayer private key
        """
        self.web3 = web3
        self.paymaster_address = Web3.to_checksum_address(paymaster_address)
        self.paymaster = web3.eth.contract(
            address=self.paymaster_address,
            abi=paymaster_abi
        )
        self.relayer_account = Account.from_key(relayer_key)
    
    def relay_transaction(
        self,
        oracle_address: str,
        target_contract: str,
        function_name: str,
        function_args: tuple,
        contract_abi: Dict[str, Any],
        gas_limit: int = 200000
    ) -> Dict[str, Any]:
        """
        Relay a transaction on behalf of oracle.
        
        Args:
            oracle_address: Oracle address
            target_contract: Target contract address
            function_name: Function to call
            function_args: Function arguments
            contract_abi: Target contract ABI
            gas_limit: Gas limit
            
        Returns:
            Dictionary with transaction result
        """
        try:
            # Build target contract call
            target = self.web3.eth.contract(
                address=Web3.to_checksum_address(target_contract),
                abi=contract_abi
            )
            
            # Encode function call
            function_call = getattr(target.functions, function_name)(*function_args)
            data = function_call._encode_transaction_data()
            
            print(f"[RelayPaymaster] Relaying transaction for oracle {oracle_address}...")
            
            # Build relay transaction
            nonce = self.web3.eth.get_transaction_count(self.relayer_account.address)
            gas_price = self.web3.eth.gas_price
            
            tx = self.paymaster.functions.relayTransaction(
                Web3.to_checksum_address(oracle_address),
                Web3.to_checksum_address(target_contract),
                data,
                gas_limit
            ).build_transaction({
                'from': self.relayer_account.address,
                'nonce': nonce,
                'gas': 400000,  # Gas for relay call
                'gasPrice': gas_price,
                'chainId': self.web3.eth.chain_id
            })
            
            # Sign and send
            signed_tx = self.relayer_account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            print(f"[RelayPaymaster] Transaction submitted: {tx_hash.hex()}")
            
            # Wait for confirmation
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                print(f"[RelayPaymaster] ✅ Transaction relayed successfully!")
                return {
                    'success': True,
                    'tx_hash': tx_hash.hex(),
                    'gas_used': receipt.gasUsed,
                    'block_number': receipt.blockNumber
                }
            else:
                return {
                    'success': False,
                    'tx_hash': tx_hash.hex(),
                    'error': 'Transaction reverted'
                }
                
        except Exception as e:
            print(f"[RelayPaymaster] ERROR: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
