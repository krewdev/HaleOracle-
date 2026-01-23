# Alternative: Traditional Wallets (Quick Start)

If you're stuck with Circle API authentication, you can use traditional wallets instead. This is actually simpler and works immediately!

## Quick Setup (2 minutes)

### Step 1: Create a Wallet

```bash
source venv/bin/activate
python3 create_wallet.py
```

This will:
- Generate a new wallet address and private key
- Optionally update your `.env` file automatically
- Show you the wallet information

### Step 2: Fund the Wallet

1. Go to https://faucet.circle.com/
2. Connect your wallet or paste the address
3. Request testnet USDC tokens

### Step 3: Deploy Contract

Use the wallet address as the oracle:

```bash
# The address from create_wallet.py is your HALE_ORACLE_ADDRESS
npm run deploy:testnet
```

### Step 4: Use Traditional Backend

```bash
./run.sh hale_oracle_backend.py
```

## Advantages of Traditional Wallets

✅ **Immediate**: Works right away, no API setup needed
✅ **Simple**: Just generate and use
✅ **Full Control**: You control the private key
✅ **No Dependencies**: No Circle API required

## Security Notes

- **Never commit private keys to git** (already in `.gitignore`)
- **Store private keys securely** (password manager, encrypted storage)
- **Use testnet keys for testing only**
- **Generate new keys for production**

## Comparison

| Feature | Traditional Wallets | Circle Wallets |
|---------|-------------------|----------------|
| Setup Time | 2 minutes | 10+ minutes |
| API Required | No | Yes |
| Key Management | You manage | Circle manages |
| Security | Your responsibility | Circle's infrastructure |
| Best For | Quick start, testing | Production, compliance |

## Switching Later

You can always switch to Circle wallets later once you get the API working. The smart contract and backend support both methods!

## Need Help?

If you need to create a wallet right now, just run:

```bash
source venv/bin/activate
python3 create_wallet.py
```

Then follow the on-screen instructions!
