# HALE Oracle - Complete System Flow

## System Architecture

```
Buyer → Frontend → Deploy Escrow → Blockchain
                                      ↓
                              Oracle Backend (Listening)
                                      ↓
                              Send OTP to Seller (Telegram)
                                      ↓
Seller → Frontend → Submit Code + OTP
                                      ↓
                              Oracle Verification
                              (Gemini AI + Sandbox)
                                      ↓
                         ≥90% Confidence → Auto-Release
                         <90% → Refund or HITL Review
```

## Complete User Flow

### 1. Buyer Creates Escrow
1. Visit frontend at `http://localhost:3000`
2. Navigate to "Provision Escrow"
3. Enter:
   - Seller's wallet address
   - Amount to escrow
   - Contract requirements (what the code should do)
   - Seller's Telegram username
4. Click "Deploy Escrow"
5. Approve transaction in MetaMask
6. Share escrow address with seller via Telegram/Discord

### 2. Oracle Detects & Sends OTP
- Backend listens for `ContractRequirementsSet` event
- Generates 5-digit OTP
- Sends OTP to seller's Telegram
- Stores OTP temporarily

### 3. Seller Submits Delivery
1. Seller receives OTP via Telegram
2. Visits `http://localhost:3000/submit`
3. Enters:
   - Their wallet address (seller address)
   - 5-digit OTP
   - Complete smart contract code
4. Clicks "Submit Delivery"

### 4. Oracle Verification
1. Backend validates OTP
2. Runs Gemini AI verification:
   - Checks if code meets requirements
   - Security audit
   - Code quality check
3. Runs sandbox execution test
4. Calculates confidence score

### 5. Automatic Settlement
- **If confidence ≥ 90%**: Funds auto-released to seller
- **If confidence < 90% but > 70%**: Queued for human review
- **If confidence < 70%**: Auto-refund to buyer

## Setup Instructions

### Prerequisites
```bash
# Install Node.js dependencies
cd frontend
npm install

# Install Python dependencies
cd ..
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration
1. Copy `.env.template` to `.env.local`
2. Fill in:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ARC_RPC_URL=https://rpc.testnet.arc.network
   ORACLE_PRIVATE_KEY=your_oracle_private_key
   HALE_ORACLE_ADDRESS=your_oracle_wallet_address
   FACTORY_CONTRACT_ADDRESS=deployed_factory_address
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token  # Optional for now
   ```

### Deploy Contracts
```bash
./deploy.sh
# Select option 1 for Testnet
```

### Start Services

#### Option 1: All-in-One
```bash
./start_oracle.sh
```

#### Option 2: Separate Terminals
```bash
# Terminal 1: Backend API
source venv/bin/activate
python api_server.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

## API Endpoints

### Health Check
```bash
GET http://localhost:5000/api/health
```

### Submit Delivery
```bash
POST http://localhost:5000/api/submit-delivery
Content-Type: application/json

{
  "seller_address": "0x...",
  "otp": "12345",
  "code": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n..."
}
```

### Check Status
```bash
GET http://localhost:5000/api/delivery-status/0x...
```

## Smart Contract Functions

### Buyer Functions
- `deposit(address seller)` - Deposit funds for a seller
- `setContractRequirements(address seller, string requirements, string sellerContact)` - Set requirements

### Seller Functions
- `submitDelivery(string deliveryHash)` - Submit code delivery

### Oracle Functions (Automated)
- `release(address seller, bytes32 transactionId)` - Release funds
- `refund(address seller, string reason)` - Refund to buyers

## Security Features

1. **Reentrancy Protection**: All state-changing functions use `nonReentrant` modifier
2. **Checks-Effects-Interactions**: Proper ordering to prevent attacks
3. **Gas Optimizations**: O(1) depositor lookups
4. **Sandboxed Execution**: Code runs in isolated environment
5. **AI Verification**: Gemini checks for security vulnerabilities
6. **OTP Verification**: Prevents unauthorized submissions

## Troubleshooting

### "Could not connect to Arc blockchain"
- Check `ARC_RPC_URL` in `.env.local`
- Try alternative RPC: `https://rpc.testnet.arc.network`
- Verify network connectivity

### "Invalid OTP"
- OTP expires after 10 minutes
- Check Telegram for latest OTP
- Ensure seller address matches

### "Gemini API Error"
- Verify `GEMINI_API_KEY` is set
- Check API quota at https://aistudio.google.com/apikey

## Development Roadmap

- [ ] Telegram Bot Integration
- [ ] IPFS Integration for code storage
- [ ] Multi-chain support
- [ ] Enhanced HITL dashboard
- [ ] Reputation system
- [ ] Dispute resolution mechanism

## License
MIT
