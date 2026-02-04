# HALE Solana: Proofs of Intent

**Solana Anchor program for HALE Oracle's on-chain attestation system**

## 🔗 Related Repositories

- **[HaleOracle-](https://github.com/krewdev/HaleOracle-)**: Main HALE Oracle backend with Gemini AI verification and Arc Network integration
- **Live Demo**: [hale-oracle.vercel.app](https://hale-oracle.vercel.app)

## Overview

HALE Solana implements **Proofs of Intent** - an on-chain attestation system that seals agent intents on Solana before execution, creating an immutable audit trail for cross-chain verification.

### Architecture

```
Agent Intent → Solana Attestation (PDA) → HALE Oracle Audit → Arc Escrow Settlement
```

### Key Features

- ✅ **Intent Sealing**: Record agent intents on-chain before execution
- ✅ **Attestation PDAs**: Anchor Program Derived Addresses for each attestation
- ✅ **Status Tracking**: Pending → Audited → Disputed lifecycle
- ✅ **Cross-Chain Bridge**: Sync attestations to Arc Network for settlement
- ✅ **Forensic Ledger**: Immutable record of all agent activities

## Program Structure

### Accounts

```rust
#[account]
pub struct Attestation {
    pub authority: Pubkey,           // Agent/user who created attestation
    pub intent_hash: [u8; 32],       // Hash of the original intent
    pub outcome_hash: Option<[u8; 32]>, // Hash of the delivered outcome
    pub report_hash: Option<[u8; 32]>,  // Hash of the audit report
    pub status: AttestationStatus,   // Current status
    pub metadata_uri: String,        // IPFS/Arweave URI for full data
    pub created_at: i64,             // Unix timestamp
    pub updated_at: i64,             // Unix timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AttestationStatus {
    Pending,    // Intent sealed, awaiting outcome
    Audited,    // Outcome submitted and verified
    Disputed,   // Verification failed or disputed
}
```

### Instructions

1. **`initialize_attestation`**: Create a new attestation for an agent intent
2. **`submit_outcome`**: Submit the delivered outcome for verification
3. **`update_status`**: Update attestation status after audit (Oracle only)

## Quick Start

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor 0.30+

### Installation

```bash
# Clone repository
git clone https://github.com/krewdev/hale-solana
cd hale-solana

# Install dependencies
npm install

# Build program
anchor build

# Run tests
anchor test
```

### Deployment

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet-beta
anchor deploy --provider.cluster mainnet-beta
```

## Usage Example

### Initialize Attestation

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HaleSolana } from "../target/types/hale_solana";

const program = anchor.workspace.HaleSolana as Program<HaleSolana>;

// Create intent hash
const intentHash = Buffer.from(
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "hex"
);

// Initialize attestation
const [attestationPda] = await PublicKey.findProgramAddress(
  [Buffer.from("attestation"), intentHash],
  program.programId
);

await program.methods
  .initializeAttestation(
    Array.from(intentHash),
    "ipfs://QmExample..."
  )
  .accounts({
    attestation: attestationPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Submit Outcome

```typescript
// After agent delivers outcome
const outcomeHash = Buffer.from(
  "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
  "hex"
);

await program.methods
  .submitOutcome(Array.from(outcomeHash))
  .accounts({
    attestation: attestationPda,
    authority: wallet.publicKey,
  })
  .rpc();
```

## Cross-Chain Bridge

The HALE Bridge relayer monitors Solana attestations and syncs them to Arc Network for escrow settlement:

```python
# From HaleOracle- repository
from hale_bridge_relayer import HaleBridge

bridge = HaleBridge(
    solana_rpc_url="https://api.devnet.solana.com",
    arc_rpc_url="https://rpc.testnet.arc.network"
)

# Register mapping
bridge.register_mapping(
    solana_attestation="ATTESTATION_PUBKEY",
    arc_seller="0x876f7ee6D6AA43c5A6cC13c05522eb47363E5907"
)

# Start monitoring
await bridge.monitor_solana_events()
```

## Program Addresses

### Devnet
- **Program ID**: `CnwQj2kPHpTbAvJT3ytzekrp7xd4HEtZJuEua9yn9MMe`

### Mainnet
- **Program ID**: TBD

## Testing

```bash
# Run full test suite
anchor test

# Run specific test
anchor test -- --test initialize_attestation
```

## Documentation

- **[HALE Oracle Docs](https://hale-oracle.vercel.app/docs)**: Full protocol documentation
- **[Anchor Book](https://book.anchor-lang.com/)**: Anchor framework guide
- **[Solana Cookbook](https://solanacookbook.com/)**: Solana development patterns

## Security

This program has been designed with security best practices:

- ✅ Proper PDA derivation
- ✅ Authority checks on all mutations
- ✅ Immutable intent hashes
- ✅ Status transition validation

**⚠️ Audit Status**: This program is currently unaudited. Use at your own risk.

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT

---

**Built for the Colosseum Agent Hackathon** 🏆