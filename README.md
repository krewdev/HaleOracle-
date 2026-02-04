# HALE Oracle

A production-ready system that uses Google Gemini AI as an autonomous forensic auditor to verify digital deliveries against smart contract terms on the Circle Arc blockchain. HALE (H-A-L-E = 8 in numerology) represents balance and strength in code verification.

## Overview

HALE Oracle eliminates trust assumptions between anonymous AI agents by:
1. Analyzing digital deliverables (code, text, data) against strict contractual terms
2. Performing security scans for malicious content
3. Outputting structured JSON verdicts that trigger blockchain transactions

## 🔗 Related Repositories

- **[hale-solana](https://github.com/krewdev/hale-solana)**: Solana Proofs of Intent - Anchor program for on-chain attestations and cross-chain bridge integration
- **Live Demo**: [hale-oracle.vercel.app](https://hale-oracle.vercel.app)

### Wallet Options

HALE Oracle supports two wallet management approaches:

- **Circle Programmable Wallets** (Recommended): Developer-controlled wallets via Circle's API for enhanced security
- **Traditional Wallets**: Direct private key management for maximum control

See [CIRCLE_WALLET_SETUP.md](CIRCLE_WALLET_SETUP.md) for Circle wallet setup.

## Architecture

```
User Request → Backend → Gemini API (HALE Oracle) → JSON Verdict → Smart Contract → Arc Blockchain
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Set it as an environment variable:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

### 3. Configure System Prompt in Google AI Studio

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new prompt
3. Copy the contents of `hale_oracle_system_prompt.txt` into the "System Instructions" box
4. Save the configuration

### 4. (Optional) Configure Arc Blockchain Connection

If you want to trigger actual blockchain transactions:

```bash
export ARC_RPC_URL="https://rpc.arc.xyz"  # Replace with actual Arc RPC endpoint
```

## Usage

### Basic Example

```python
from hale_oracle_backend import HaleOracle
import json

# Initialize oracle
oracle = HaleOracle(
    gemini_api_key=os.getenv('GEMINI_API_KEY'),
    arc_rpc_url=os.getenv('ARC_RPC_URL')  # Optional
)

# Load contract data
contract_data = {
    "transaction_id": "tx_0x123abc_arc",
    "Contract_Terms": "Generate a Python script to fetch USDC price",
    "Acceptance_Criteria": [
        "Must be written in Python 3",
        "Must handle API errors gracefully",
        "Must print the price to console"
    ],
    "Delivery_Content": "import requests\n\ndef get_usdc_price():\n    ..."
}

# Process delivery
result = oracle.process_delivery(
    contract_data=contract_data,
    seller_address="0xSellerAddress123"
)

print(json.dumps(result, indent=2))
```

### Running the Test Example

```bash
python hale_oracle_backend.py
```

This will:
1. Load `test_example.json`
2. Send it to Gemini for verification
3. Display the verdict
4. Show how the smart contract would be triggered

## Output Format

HALE Oracle returns a JSON object with this structure:

```json
{
  "transaction_id": "tx_0x123abc_arc",
  "verdict": "PASS",
  "confidence_score": 98,
  "release_funds": true,
  "reasoning": "The script is valid Python 3, correctly targets the CoinGecko API for USDC, and includes a try-except block for error handling as requested.",
  "risk_flags": []
}
```

### Verdict Rules

- `verdict`: Either "PASS" or "FAIL"
- `confidence_score`: 0-100 (must be ≥90 for PASS)
- `release_funds`: `true` only if verdict is PASS and confidence ≥90
- `reasoning`: Concise explanation (max 2 sentences)
- `risk_flags`: Array of security or compliance concerns

## Hackathon Demo Flow

1. **Frontend**: User submits a request, Bot submits code
2. **Backend Logs**:
   ```
   [HALE Oracle] Sending delivery to HALE Oracle (Gemini)...
   [HALE Oracle] Verdict: PASS
   [HALE Oracle] Confidence: 98%
   [Blockchain] Triggering Smart Contract: Escrow.release(0xSellerAddress)...
   ```
3. **Blockchain**: Show transaction on [Arc Block Explorer](https://explorer.arc.xyz)

## Integration with Smart Contracts

The `trigger_smart_contract()` method is a placeholder. To integrate with actual Arc smart contracts, follow these steps:

### Prerequisites

1. **Deploy an Escrow Contract on Arc**
   - Create a smart contract that holds funds in escrow
   - Implement a `release(address seller)` function that transfers funds
   - Ensure the contract has proper access controls (only HALE Oracle can call release)

2. **Set Up Environment Variables**
   ```bash
   export ARC_RPC_URL="https://rpc.arc.xyz"  # Arc blockchain RPC endpoint
   export ESCROW_CONTRACT_ADDRESS="0x..."    # Your deployed escrow contract address
   export ORACLE_PRIVATE_KEY="0x..."         # Private key for signing transactions (keep secure!)
   ```

3. **Get Contract ABI**
   - Export your contract ABI from your deployment tool (Hardhat, Foundry, etc.)
   - Save it as `escrow_abi.json` or include it directly in your code

### Implementation Example

Here's a complete implementation of `trigger_smart_contract()`:

```python
import json
from eth_account import Account

def trigger_smart_contract(self, verdict: Dict[str, Any], seller_address: str, 
                           contract_address: Optional[str] = None) -> bool:
    """
    Trigger the smart contract to release funds if verdict is PASS.
    """
    if not verdict.get('release_funds', False):
        print("[Blockchain] Funds will NOT be released (verdict: FAIL)")
        return False
    
    if not self.web3:
        print("[Blockchain] WARNING: No blockchain connection configured")
        return False
    
    # Use provided address or environment variable
    escrow_address = contract_address or os.getenv('ESCROW_CONTRACT_ADDRESS')
    if not escrow_address:
        print("[Blockchain] ERROR: No contract address provided")
        return False
    
    # Load contract ABI
    with open('escrow_abi.json', 'r') as f:
        escrow_abi = json.load(f)
    
    # Initialize contract
    contract = self.web3.eth.contract(
        address=Web3.to_checksum_address(escrow_address),
        abi=escrow_abi
    )
    
    # Get oracle account
    oracle_private_key = os.getenv('ORACLE_PRIVATE_KEY')
    if not oracle_private_key:
        print("[Blockchain] ERROR: ORACLE_PRIVATE_KEY not set")
        return False
    
    oracle_account = Account.from_key(oracle_private_key)
    oracle_address = oracle_account.address
    
    try:
        # Build transaction
        nonce = self.web3.eth.get_transaction_count(oracle_address)
        gas_price = self.web3.eth.gas_price
        
        transaction = contract.functions.release(
            Web3.to_checksum_address(seller_address)
        ).build_transaction({
            'from': oracle_address,
            'nonce': nonce,
            'gas': 100000,  # Adjust based on your contract
            'gasPrice': gas_price,
            'chainId': 12345  # Replace with Arc chain ID
        })
        
        # Sign transaction
        signed_txn = oracle_account.sign_transaction(transaction)
        
        # Send transaction
        print(f"[Blockchain] Submitting transaction to release funds to {seller_address}...")
        tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for confirmation
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if receipt.status == 1:
            print(f"[Blockchain] ✅ Transaction successful!")
            print(f"[Blockchain] Transaction hash: {tx_hash.hex()}")
            print(f"[Blockchain] Block: {receipt.blockNumber}")
            print(f"[Blockchain] View on explorer: https://explorer.arc.xyz/tx/{tx_hash.hex()}")
            return True
        else:
            print(f"[Blockchain] ❌ Transaction failed")
            return False
            
    except Exception as e:
        print(f"[Blockchain] ERROR: {str(e)}")
        return False
```

### Example Escrow Contract Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Escrow {
    address public oracle;  // HALE Oracle address
    mapping(address => uint256) public deposits;
    
    constructor(address _oracle) {
        oracle = _oracle;
    }
    
    function deposit(address seller) external payable {
        deposits[seller] += msg.value;
    }
    
    function release(address seller) external {
        require(msg.sender == oracle, "Only oracle can release");
        uint256 amount = deposits[seller];
        require(amount > 0, "No funds to release");
        
        deposits[seller] = 0;
        payable(seller).transfer(amount);
    }
}
```

### Security Best Practices

- **Private Key Management**: Never commit private keys to version control. Use environment variables or secure key management services
- **Access Control**: Ensure only the HALE Oracle address can call `release()` in your smart contract
- **Gas Limits**: Set appropriate gas limits to prevent failed transactions
- **Error Handling**: Implement retry logic for network failures
- **Transaction Monitoring**: Monitor transaction status and implement alerts for failures
- **Multi-sig**: Consider using a multi-signature wallet for production deployments

### Testing

Before deploying to mainnet, test on Arc testnet:

```python
# Test transaction
result = oracle.process_delivery(contract_data, seller_address)
if result['transaction_success']:
    print("✅ Funds released successfully")
else:
    print("❌ Transaction failed - check logs")
```

## Security Considerations

- HALE Oracle performs security scans for:
  - Infinite loops in code
  - Prompt injection attempts
  - Phishing links
  - Other malicious patterns

- Always validate the JSON response structure before processing
- Implement rate limiting for production use
- Store API keys securely (use environment variables or secrets management)

## Frontend

HALE Oracle includes a comprehensive web frontend for deploying, customizing, monitoring, and integrating the oracle.

### Features

- ✅ **Verification Form**: Enter custom data and verify deliveries
- ✅ **Deployment**: Deploy and configure the escrow contract
- ✅ **Monitoring**: Real-time monitoring of oracle performance
- ✅ **Documentation**: Comprehensive guides and API reference
- ✅ **Integration**: Easy integration guides for projects and agent wallets

### Quick Start

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Start the backend API (in project root):
```bash
python backend_api.py
```

3. Start the frontend (in frontend directory):
```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser

Or use the convenience script:
```bash
./start_frontend.sh
```

### Frontend Structure

- `frontend/src/components/VerificationForm.jsx` - Main verification interface
- `frontend/src/components/Deployment.jsx` - Contract deployment
- `frontend/src/components/Monitoring.jsx` - Oracle monitoring dashboard
- `frontend/src/components/Documentation.jsx` - Comprehensive documentation
- `frontend/src/components/Integration.jsx` - Integration guides

See [frontend/README.md](frontend/README.md) for detailed frontend documentation.

## Files

- `hale_oracle_system_prompt.txt`: System instructions for Gemini
- `hale_oracle_backend.py`: Main backend implementation
- `backend_api.py`: REST API server for frontend
- `test_example.json`: Example contract data for testing
- `requirements.txt`: Python dependencies
- `frontend/`: React frontend application

## License

MIT
