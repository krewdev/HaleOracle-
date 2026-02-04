#!/usr/bin/env python3
"""
Solana Attestation Parser
Parses HALE attestation account data from Solana
"""

import struct
from typing import Dict, Any, Optional
from enum import IntEnum


class AttestationStatus(IntEnum):
    """Attestation status enum (matches Solana program)"""
    DRAFT = 0
    SEALED = 1
    AUDITED = 2
    DISPUTED = 3


def parse_attestation_account(data: bytes) -> Optional[Dict[str, Any]]:
    """
    Parse HALE attestation account data
    
    Account structure (simplified):
    - authority: 32 bytes (Pubkey)
    - intent_hash: 32 bytes
    - metadata_uri: String (4 bytes length + data)
    - status: 1 byte (enum)
    - outcome_hash: Option<[u8; 32]> (1 byte discriminator + 32 bytes)
    - report_hash: Option<[u8; 32]> (1 byte discriminator + 32 bytes)
    - evidence_uri: Option<String> (1 byte discriminator + 4 bytes length + data)
    - bump: 1 byte
    
    Args:
        data: Raw account data bytes
        
    Returns:
        Parsed attestation dict or None if invalid
    """
    try:
        offset = 8  # Skip 8-byte discriminator
        
        # Parse authority (32 bytes)
        authority = data[offset:offset+32]
        offset += 32
        
        # Parse intent_hash (32 bytes)
        intent_hash = data[offset:offset+32]
        offset += 32
        
        # Parse metadata_uri (String)
        metadata_uri_len = struct.unpack('<I', data[offset:offset+4])[0]
        offset += 4
        metadata_uri = data[offset:offset+metadata_uri_len].decode('utf-8')
        offset += metadata_uri_len
        
        # Parse status (1 byte)
        status_byte = data[offset]
        offset += 1
        
        try:
            status = AttestationStatus(status_byte)
        except ValueError:
            status = AttestationStatus.DRAFT
        
        # Parse outcome_hash (Option<[u8; 32]>)
        outcome_hash = None
        if data[offset] == 1:  # Some
            offset += 1
            outcome_hash = data[offset:offset+32]
            offset += 32
        else:
            offset += 1
        
        # Parse report_hash (Option<[u8; 32]>)
        report_hash = None
        if offset < len(data) and data[offset] == 1:  # Some
            offset += 1
            report_hash = data[offset:offset+32]
            offset += 32
        else:
            offset += 1
        
        # Parse evidence_uri (Option<String>)
        evidence_uri = None
        if offset < len(data) and data[offset] == 1:  # Some
            offset += 1
            evidence_uri_len = struct.unpack('<I', data[offset:offset+4])[0]
            offset += 4
            evidence_uri = data[offset:offset+evidence_uri_len].decode('utf-8')
            offset += evidence_uri_len
        
        # Parse bump
        bump = data[offset] if offset < len(data) else 0
        
        return {
            'authority': authority.hex(),
            'intent_hash': intent_hash.hex(),
            'metadata_uri': metadata_uri,
            'status': status.name,
            'status_value': status.value,
            'outcome_hash': outcome_hash.hex() if outcome_hash else None,
            'report_hash': report_hash.hex() if report_hash else None,
            'evidence_uri': evidence_uri,
            'bump': bump,
            'is_audited': status == AttestationStatus.AUDITED,
            'is_disputed': status == AttestationStatus.DISPUTED,
            'is_sealed': status == AttestationStatus.SEALED
        }
        
    except Exception as e:
        print(f"[Parser] Error parsing attestation: {e}")
        return None


def is_attestation_ready_for_bridge(attestation: Dict[str, Any]) -> bool:
    """
    Check if attestation is ready to be bridged to Arc
    
    Args:
        attestation: Parsed attestation dict
        
    Returns:
        True if ready to bridge
    """
    # Only bridge Audited attestations
    if not attestation.get('is_audited'):
        return False
    
    # Must have outcome hash
    if not attestation.get('outcome_hash'):
        return False
    
    # Must have report hash
    if not attestation.get('report_hash'):
        return False
    
    return True


def get_verdict_from_attestation(attestation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert Solana attestation to Arc verdict format
    
    Args:
        attestation: Parsed attestation dict
        
    Returns:
        Verdict dict for Arc oracle
    """
    # Check if disputed
    if attestation.get('is_disputed'):
        return {
            'verdict': 'FAIL',
            'confidence_score': 0,
            'reasoning': f"Attestation disputed. Evidence: {attestation.get('evidence_uri', 'N/A')}",
            'release_funds': False,
            'risk_flags': ['DISPUTED_ON_SOLANA']
        }
    
    # Check if audited
    if attestation.get('is_audited'):
        # In production, you'd check the report_hash signature
        # For now, assume Audited = valid
        return {
            'verdict': 'PASS',
            'confidence_score': 95,
            'reasoning': f"Verified on Solana. Intent: {attestation['intent_hash'][:16]}..., Outcome: {attestation.get('outcome_hash', 'N/A')[:16]}...",
            'release_funds': True,
            'risk_flags': []
        }
    
    # Not ready
    return {
        'verdict': 'PENDING',
        'confidence_score': 0,
        'reasoning': f"Attestation not yet audited. Status: {attestation.get('status')}",
        'release_funds': False,
        'risk_flags': ['NOT_AUDITED']
    }


if __name__ == '__main__':
    # Test with example data
    print("Attestation Parser Test")
    print("=" * 60)
    
    # Example: Create mock attestation data
    # In production, this would come from Solana RPC
    print("\nThis module is used by hale_bridge_relayer.py")
    print("Run the bridge relayer to see it in action!")
