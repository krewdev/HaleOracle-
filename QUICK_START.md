# HALE Oracle Quick Start Guide

Get up and running in 5 minutes!

## 1. Setup Environment (2 minutes)

```bash
# Create virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp env.template .env

# Edit .env file with your values
nano .env  # or use your preferred editor
```

**Or use the helper script:**
```bash
./run.sh  # Will create venv and install deps automatically
```

**Minimum required in `.env`:**
- `GEMINI_API_KEY` - Get from https://aistudio.google.com/apikey
- `HALE_ORACLE_ADDRESS` - Your oracle wallet address
- `ORACLE_PRIVATE_KEY` - Private key for oracle wallet
- `PRIVATE_KEY` - Private key for deployment wallet
- `ARC_TESTNET_RPC_URL` - Arc testnet RPC (default: https://rpc.testnet.arc.network)
- `ARC_TESTNET_CHAIN_ID` - Arc testnet chain ID (default: 5042002)

**Get testnet tokens:** https://faucet.circle.com

## 2. Deploy Contract (1 minute)

### Option A: Using the deployment script (Recommended)
```bash
./deploy.sh
```

### Option B: Manual deployment
```bash
# Compile
npm run compile

# Deploy to testnet
npm run deploy:testnet

# Or deploy to mainnet
npm run deploy:mainnet
```

After deployment, **copy the contract address** and add it to `.env`:
```bash
ESCROW_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## 3. Export Contract ABI (30 seconds)

```bash
cat artifacts/contracts/ArcFuseEscrow.sol/ArcFuseEscrow.json | jq .abi > escrow_abi.json
```

## 4. Verify Contract (Optional, 1 minute)

```bash
npx hardhat verify --network arcTestnet <CONTRACT_ADDRESS> <ORACLE_ADDRESS>
```

View on explorer: https://testnet.arcscan.app

## 5. Test the System (30 seconds)

```bash
# Activate virtual environment first
source venv/bin/activate

# Test backend (traditional wallets)
python3 hale_oracle_backend.py

# Or test with Circle wallets
python3 hale_oracle_backend_circle.py

# Or run example scenarios
python3 example_usage.py
```

**Or use the helper script:**
```bash
./run.sh hale_oracle_backend.py
./run.sh hale_oracle_backend_circle.py
./run.sh example_usage.py
```

## 6. Setup Google AI Studio (1 minute)

1. Go to https://aistudio.google.com/
2. Create a new prompt
3. Copy contents of `hale_oracle_system_prompt.txt` into "System Instructions"
4. Save

## That's it! 🎉

Your HALE Oracle is now ready to verify deliveries and manage escrow.

## Next Steps

- Check contract state: `npx hardhat run scripts/checkContract.js --network arcTestnet`
- Review [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for production deployment
- Read [README.md](README.md) for full documentation

## Troubleshooting

**Contract won't deploy?**
- Check you have funds in deployment wallet
- Verify RPC URL is correct
- Check chain ID matches network

**Backend can't connect?**
- Verify `ARC_RPC_URL` in `.env`
- Check `ESCROW_CONTRACT_ADDRESS` is set
- Ensure `escrow_abi.json` exists

**Tests failing?**
- Run `npm test` to see specific errors
- Make sure all dependencies installed: `npm install`

## Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
- Review [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for step-by-step checklist
- Check contract code in `contracts/ArcFuseEscrow.sol`
