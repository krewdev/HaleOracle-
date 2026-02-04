#!/usr/bin/env python3
"""
HALE Cross-Chain Bridge Relayer
Syncs Solana attestation state to Arc Network escrow decisions
"""

import os
import json
import time
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

# Solana imports
from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey
from solders.signature import Signature
from anchorpy import Provider, Wallet, Program, Context
from anchorpy.provider import DEFAULT_OPTIONS

# Arc imports
from hale_oracle_backend import HaleOracle
from solana_attestation_parser import (
    parse_attestation_account,
    is_attestation_ready_for_bridge,
    get_verdict_from_attestation
)

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv('.env.local')
except:
    pass


class HaleBridge:
    """
    Cross-chain bridge that syncs HALE attestations from Solana to Arc escrow
    """
    
    def __init__(
        self,
        solana_rpc_url: str = "https://api.devnet.solana.com",
        arc_rpc_url: Optional[str] = None,
        gemini_api_key: Optional[str] = None
    ):
        """
        Initialize the HALE Bridge
        
        Args:
            solana_rpc_url: Solana RPC endpoint
            arc_rpc_url: Arc Network RPC endpoint
            gemini_api_key: Gemini API key for oracle
        """
        self.solana_rpc_url = solana_rpc_url
        self.arc_rpc_url = arc_rpc_url or os.getenv('ARC_RPC_URL')
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        
        # Initialize Arc Oracle
        self.arc_oracle = HaleOracle(self.gemini_api_key, self.arc_rpc_url)
        
        # Solana program ID
        self.program_id = Pubkey.from_string("CnwQj2kPHpTbAvJT3ytzekrp7xd4HEtZJuEua9yn9MMe")
        
        # Bridge state
        self.bridge_mappings_file = 'bridge_mappings.json'
        self.bridge_mappings = self._load_mappings()
        self.synced_attestations = set()
        self.mock_attestations = {}
        
        print(f"[Bridge] Initialized")
        print(f"[Bridge] Solana RPC: {solana_rpc_url}")
        print(f"[Bridge] Arc RPC: {self.arc_rpc_url}")
        print(f"[Bridge] Program ID: {self.program_id}")
    
    def _load_mappings(self) -> Dict[str, Any]:
        """Load bridge mappings from file"""
        if os.path.exists(self.bridge_mappings_file):
            try:
                with open(self.bridge_mappings_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[Bridge] Error loading mappings: {e}")
        return {}
    
    def _save_mappings(self):
        """Save bridge mappings to file"""
        try:
            with open(self.bridge_mappings_file, 'w') as f:
                json.dump(self.bridge_mappings, f, indent=2)
        except Exception as e:
            print(f"[Bridge] Error saving mappings: {e}")
    
    def register_mapping(
        self,
        solana_attestation: str,
        arc_seller: str,
        arc_escrow: Optional[str] = None
    ):
        """
        Register a mapping between Solana attestation and Arc seller
        
        Args:
            solana_attestation: Solana attestation pubkey (base58)
            arc_seller: Arc seller address (0x...)
            arc_escrow: Optional specific Arc escrow address
        """
        mapping_id = solana_attestation
        
        self.bridge_mappings[mapping_id] = {
            'solana_attestation': solana_attestation,
            'arc_seller': arc_seller.lower(),
            'arc_escrow': arc_escrow.lower() if arc_escrow else None,
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'synced_at': None
        }
        
        self._save_mappings()
        print(f"[Bridge] Registered mapping: {solana_attestation[:8]}... → {arc_seller}")
    
    def inject_mock_attestation(self, attestation_pubkey: str, status: str = 'Audited'):
        """
        Inject a mock attestation for testing purposes
        
        Args:
            attestation_pubkey: Mock pubkey
            status: Mock status
        """
        import secrets
        mock_intent = secrets.token_hex(32)
        
        self.mock_attestations[attestation_pubkey] = {
            'pubkey': attestation_pubkey,
            'status': status,
            'intent_hash': mock_intent,
            'outcome_hash': '1' * 64,
            'report_hash': '2' * 64,
            'is_audited': status == 'Audited',
            'is_disputed': status == 'Disputed',
            'metadata_uri': 'ipfs://mock',
            'authority': '0x876f7ee6D6AA43c5A6cC13c05522eb47363E5907'
        }
        print(f"[Bridge] Injected mock attestation: {attestation_pubkey} with intent: {mock_intent[:16]}...")

    async def fetch_attestation(self, attestation_pubkey: Pubkey) -> Optional[Dict[str, Any]]:
        """
        Fetch attestation data from Solana
        
        Args:
            attestation_pubkey: Attestation account pubkey
            
        Returns:
            Attestation data dict or None if not found
        """
        # Check mock data first
        if str(attestation_pubkey) in self.mock_attestations:
            return self.mock_attestations[str(attestation_pubkey)]

        try:
            client = AsyncClient(self.solana_rpc_url)
            # ... rest of existing code ...
            
            # Fetch account data
            response = await client.get_account_info(attestation_pubkey)
            
            if not response.value:
                print(f"[Bridge] Attestation not found: {attestation_pubkey}")
                await client.close()
                return None
            
            account_data = response.value.data
            
            # Parse attestation data using parser
            attestation = parse_attestation_account(account_data)
            
            if not attestation:
                print(f"[Bridge] Failed to parse attestation data")
                await client.close()
                return None
            
            # Add pubkey to result
            attestation['pubkey'] = str(attestation_pubkey)
            
            await client.close()
            return attestation
            
        except Exception as e:
            print(f"[Bridge] Error fetching attestation: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def sync_attestation_to_arc(
        self,
        solana_attestation_pubkey: str,
        force: bool = False
    ) -> bool:
        """
        Sync a Solana attestation to Arc escrow
        
        Args:
            solana_attestation_pubkey: Solana attestation pubkey (base58)
            force: Force sync even if already synced
            
        Returns:
            True if synced successfully
        """
        # Check if already synced
        if solana_attestation_pubkey in self.synced_attestations and not force:
            print(f"[Bridge] Already synced: {solana_attestation_pubkey[:8]}...")
            return True
        
        # Get mapping
        mapping = self.bridge_mappings.get(solana_attestation_pubkey)
        if not mapping:
            print(f"[Bridge] No mapping found for: {solana_attestation_pubkey[:8]}...")
            return False
        
        print(f"\n[Bridge] Syncing attestation: {solana_attestation_pubkey[:8]}...")
        
        # Fetch attestation from Solana
        attestation_pubkey = Pubkey.from_string(solana_attestation_pubkey)
        attestation = await self.fetch_attestation(attestation_pubkey)
        
        if not attestation:
            print(f"[Bridge] Failed to fetch attestation")
            return False
        
        # Display attestation details
        print(f"[Bridge] Attestation fetched from Solana")
        print(f"[Bridge] Status: {attestation.get('status')}")
        print(f"[Bridge] Intent Hash: {attestation.get('intent_hash', 'N/A')[:16]}...")
        print(f"[Bridge] Outcome Hash: {attestation.get('outcome_hash', 'N/A')[:16] if attestation.get('outcome_hash') else 'None'}...")
        
        # Check if ready for bridge
        if not is_attestation_ready_for_bridge(attestation):
            print(f"[Bridge] Attestation not ready for bridge (status: {attestation.get('status')})")
            return False
        
        # Get Arc seller address
        arc_seller = mapping['arc_seller']
        arc_escrow = mapping.get('arc_escrow') or os.getenv('ESCROW_CONTRACT_ADDRESS')
        
        # Create transaction ID from intent hash
        transaction_id = f"solana_{attestation['intent_hash'][:16]}"
        
        # Trigger Arc escrow action
        print(f"[Bridge] Triggering Arc escrow action...")
        print(f"[Bridge] Seller: {arc_seller}")
        print(f"[Bridge] Escrow: {arc_escrow}")
        
        # Convert attestation to verdict
        verdict = get_verdict_from_attestation(attestation)
        
        # Trigger smart contract
        success = self.arc_oracle.trigger_smart_contract(
            verdict=verdict,
            seller_address=arc_seller,
            transaction_id=transaction_id,
            contract_address=arc_escrow
        )
        
        if success:
            # Update mapping
            mapping['status'] = 'synced'
            mapping['synced_at'] = datetime.now().isoformat()
            self._save_mappings()
            
            # Mark as synced
            self.synced_attestations.add(solana_attestation_pubkey)
            
            print(f"[Bridge] ✅ Successfully synced to Arc!")
            return True
        else:
            print(f"[Bridge] ❌ Failed to sync to Arc")
            return False
    
    async def monitor_solana_events(self, poll_interval: int = 10):
        """
        Monitor Solana for new attestation events
        
        Args:
            poll_interval: Seconds between polls
        """
        print(f"\n[Bridge] Starting Solana event monitor...")
        print(f"[Bridge] Poll interval: {poll_interval}s")
        
        while True:
            try:
                # Check all registered mappings
                for attestation_pubkey, mapping in self.bridge_mappings.items():
                    if mapping['status'] == 'pending':
                        print(f"\n[Bridge] Checking pending attestation: {attestation_pubkey[:8]}...")
                        
                        # Try to sync
                        await self.sync_attestation_to_arc(attestation_pubkey)
                
                # Wait before next poll
                await asyncio.sleep(poll_interval)
                
            except KeyboardInterrupt:
                print(f"\n[Bridge] Shutting down...")
                break
            except Exception as e:
                print(f"[Bridge] Error in monitor loop: {e}")
                await asyncio.sleep(poll_interval)
    
    def get_bridge_status(self) -> Dict[str, Any]:
        """Get current bridge status"""
        return {
            'total_mappings': len(self.bridge_mappings),
            'synced_count': len(self.synced_attestations),
            'pending_count': sum(1 for m in self.bridge_mappings.values() if m['status'] == 'pending'),
            'solana_rpc': self.solana_rpc_url,
            'arc_rpc': self.arc_rpc_url,
            'arc_oracle_connected': self.arc_oracle.web3 and self.arc_oracle.web3.is_connected()
        }


async def main():
    """Example usage of HALE Bridge"""
    
    print("=" * 60)
    print("HALE CROSS-CHAIN BRIDGE")
    print("=" * 60)
    print()
    
    # Initialize bridge
    bridge = HaleBridge()
    
    # Show status
    status = bridge.get_bridge_status()
    print(f"Bridge Status:")
    print(f"  Total Mappings: {status['total_mappings']}")
    print(f"  Synced: {status['synced_count']}")
    print(f"  Pending: {status['pending_count']}")
    print(f"  Arc Oracle Connected: {status['arc_oracle_connected']}")
    print()
    
    # Example: Register a mapping
    # bridge.register_mapping(
    #     solana_attestation="EXAMPLE_PUBKEY_HERE",
    #     arc_seller="0x876f7ee6D6AA43c5A6cC13c05522eb47363E5907"
    # )
    
    # Start monitoring
    print("Starting event monitor...")
    print("Press Ctrl+C to stop")
    print()
    
    await bridge.monitor_solana_events(poll_interval=10)


if __name__ == '__main__':
    asyncio.run(main())
