# HALE Oracle Deployment Guide

Complete guide for deploying HALE Oracle and the Escrow smart contract.

## Prerequisites

1. **Node.js and npm** (for Hardhat)
   ```bash
   node --version  # Should be v16+
   npm --version
   ```

2. **Python 3.8+** (for HALE Oracle backend)
   ```bash
   python3 --version
   ```

3. **Arc Wallet** with testnet/mainnet funds
   - Create or import wallet
   - Fund with testnet tokens for deployment

## Step 1: Install Dependencies

### Backend (Python)
```bash
pip install -r requirements.txt
```

### Smart Contract (Node.js)
```bash
npm install
```

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
# Copy example (if available)
cp .env.example .env

# Or create manually
touch .env
```

Add your configuration:

```env
# Gemini API
GEMINI_API_KEY=your-api-key-here

# Arc Network
ARC_RPC_URL=https://rpc.arc.xyz
ARC_CHAIN_ID=12345
ARC_TESTNET_RPC_URL=https://testnet-rpc.arc.xyz
ARC_TESTNET_CHAIN_ID=54321

# Oracle Address (your wallet address that will sign transactions)
HALE_ORACLE_ADDRESS=0xYourOracleAddressHere

# Private Key for Deployment (NEVER commit to git!)
PRIVATE_KEY=0xYourPrivateKeyForDeployment

# Oracle Private Key (for backend to sign transactions)
ORACLE_PRIVATE_KEY=0xYourOraclePrivateKeyHere
```

## Step 3: Deploy Escrow Contract

### Compile Contract
```bash
npm run compile
```

### Deploy to Testnet
```bash
# Set HALE_ORACLE_ADDRESS in .env first
npm run deploy:testnet
```

### Deploy to Mainnet
```bash
npm run deploy:mainnet
```

After deployment, you'll get a contract address. Add it to your `.env`:

```env
ESCROW_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## Step 4: Verify Contract (Optional)

Verify on block explorer:

```bash
npx hardhat verify --network arc <CONTRACT_ADDRESS> <ORACLE_ADDRESS>
```

## Step 5: Export Contract ABI

Export the ABI for use in the backend:

```bash
cat artifacts/contracts/Escrow.sol/Escrow.json | jq .abi > escrow_abi.json
```

## Step 6: Configure HALE Oracle Backend

Update `hale_oracle_backend.py` to use your contract:

1. Set `ESCROW_CONTRACT_ADDRESS` in `.env`
2. Place `escrow_abi.json` in the project root
3. Ensure `ORACLE_PRIVATE_KEY` matches `HALE_ORACLE_ADDRESS`

## Step 7: Test the Integration

### Test Smart Contract
```bash
npm test
```

### Test HALE Oracle
```bash
python3 hale_oracle_backend.py
```

### Test Full Flow
```bash
python3 example_usage.py
```

## Step 8: Update System Prompt

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new prompt
3. Copy contents of `hale_oracle_system_prompt.txt` into "System Instructions"
4. Save configuration

## Security Checklist

Before going to production:

- [ ] Private keys stored securely (not in git)
- [ ] Contract verified on block explorer
- [ ] Oracle address is correct in contract
- [ ] Tested on testnet first
- [ ] Multi-sig wallet for owner (optional but recommended)
- [ ] Rate limiting implemented
- [ ] Error handling and monitoring set up
- [ ] Backup of private keys in secure location

## Troubleshooting

### Contract Deployment Fails
- Check you have enough funds for gas
- Verify RPC URL is correct
- Ensure chain ID matches network

### Backend Can't Connect
- Verify `ARC_RPC_URL` is correct
- Check network connectivity
- Ensure Web3 provider is accessible

### Transactions Fail
- Verify oracle address matches contract
- Check private key is correct
- Ensure oracle has enough gas
- Verify contract has funds to release

## Next Steps

1. **Monitor Transactions**: Set up alerts for failed transactions
2. **Add Frontend**: Build UI for users to interact with HALE Oracle
3. **Scale**: Consider multiple oracle instances for redundancy
4. **Audit**: Get smart contract audited before mainnet deployment

## Support

For issues or questions:
- Check contract documentation in `contracts/README.md`
- Review backend code in `hale_oracle_backend.py`
- Check test files for usage examples
