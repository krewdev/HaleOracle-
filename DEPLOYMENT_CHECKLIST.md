# HALE Oracle Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Pre-Deployment

### Environment Setup
- [ ] Node.js v16+ installed
- [ ] Python 3.8+ installed
- [ ] Dependencies installed (`npm install` and `pip install -r requirements.txt`)
- [ ] All tests passing (`npm test`)

### Configuration
- [ ] Created `.env` file from `.env.example`
- [ ] Set `GEMINI_API_KEY` (get from https://aistudio.google.com/apikey)
- [ ] Set `HALE_ORACLE_ADDRESS` (your oracle wallet address)
- [ ] Set `ORACLE_PRIVATE_KEY` (private key for oracle wallet)
- [ ] Set `PRIVATE_KEY` (private key for deployment wallet)
- [ ] Set `ARC_RPC_URL` and `ARC_CHAIN_ID` (or testnet equivalents)
- [ ] Verified all addresses are correct (no typos)

### Wallet Preparation
- [ ] Oracle wallet has sufficient funds for gas
- [ ] Deployment wallet has sufficient funds for deployment + gas
- [ ] Tested wallet connectivity to Arc network
- [ ] Backed up private keys securely (never commit to git!)

### Contract Verification
- [ ] Contract compiles successfully (`npm run compile`)
- [ ] All tests pass (`npm test`)
- [ ] Reviewed contract code for correctness
- [ ] Oracle address is correct (will be set in constructor)

## Deployment Steps

### Testnet Deployment (Recommended First)
- [ ] Set testnet RPC URL and chain ID in `.env`
- [ ] Run `npm run deploy:testnet` or `./deploy.sh`
- [ ] Copy contract address from deployment output
- [ ] Update `ESCROW_CONTRACT_ADDRESS` in `.env`
- [ ] Test deposit function on testnet
- [ ] Test release function on testnet
- [ ] Test refund function on testnet
- [ ] Verify contract on block explorer (optional)

### Mainnet Deployment
- [ ] Successfully tested on testnet
- [ ] Set mainnet RPC URL and chain ID in `.env`
- [ ] Double-check all addresses and keys
- [ ] Ensure sufficient funds in wallets
- [ ] Run `npm run deploy:mainnet` or `./deploy.sh`
- [ ] Copy contract address from deployment output
- [ ] Update `ESCROW_CONTRACT_ADDRESS` in `.env`
- [ ] Verify contract on block explorer
- [ ] Test with small deposit first

## Post-Deployment

### Backend Integration
- [ ] Export contract ABI: `cat artifacts/contracts/ArcFuseEscrow.sol/ArcFuseEscrow.json | jq .abi > escrow_abi.json`
- [ ] Update `hale_oracle_backend.py` with contract address
- [ ] Test HALE Oracle backend with test delivery
- [ ] Verify JSON verdict parsing works
- [ ] Test smart contract interaction (release/refund)

### System Prompt Setup
- [ ] Go to Google AI Studio (https://aistudio.google.com/)
- [ ] Create new prompt
- [ ] Copy contents of `hale_oracle_system_prompt.txt` to System Instructions
- [ ] Save configuration
- [ ] Test with example input

### Monitoring & Security
- [ ] Set up transaction monitoring/alerts
- [ ] Document contract address and deployment details
- [ ] Store deployment info securely
- [ ] Consider multi-sig for production (optional)
- [ ] Implement rate limiting for production
- [ ] Set up error logging and monitoring

## Verification Commands

```bash
# Check contract deployment
npx hardhat verify --network arc <CONTRACT_ADDRESS> <ORACLE_ADDRESS>

# Check contract state
npx hardhat run scripts/checkContract.js --network arc

# Test deposit (using ethers console or script)
# Test release (using oracle account)
# Test refund (using oracle account)
```

## Emergency Contacts

- Contract Owner: [Your contact info]
- Oracle Operator: [Your contact info]
- Network Support: [Arc network support]

## Notes

- Always test on testnet first
- Start with small amounts
- Keep private keys secure
- Monitor transactions after deployment
- Document all addresses and keys securely
