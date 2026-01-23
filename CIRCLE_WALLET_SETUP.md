# Circle Programmable Wallets Setup

HALE Oracle supports Circle's developer-controlled wallets for enhanced security and wallet management.

## Why Use Circle Wallets?

- **Enhanced Security**: Private keys never leave Circle's secure infrastructure
- **Simplified Management**: No need to manage private keys directly
- **API-Based Control**: Programmatically create and manage wallets
- **Multi-Chain Support**: Works across multiple blockchains including Arc
- **Built-in Compliance**: Circle handles compliance requirements

## Prerequisites

1. **Circle Account**: Sign up at https://console.circle.com/
2. **API Key**: Get your API key from Circle Console
3. **Entity Secret**: Get your entity secret for wallet operations

## Setup Steps

### 1. Get Circle Credentials

1. Go to https://console.circle.com/
2. Navigate to **API Keys** section (or **Developer Settings** → **API Keys**)
3. Create a new API key or view existing one
4. **Important**: Copy the **complete** API key in format: `TEST_API_KEY:key_id:key_secret`
5. Copy your **Entity Secret** (separate from API key)
6. Add to `.env` file:

```env
# API Key format: TEST_API_KEY:key_id:key_secret (3 parts separated by colons)
CIRCLE_API_KEY=TEST_API_KEY:your-key-id:your-key-secret
CIRCLE_ENTITY_SECRET=your-entity-secret-here
```

**Verify your credentials:**
```bash
source venv/bin/activate
python3 verify_circle_credentials.py
```

If you get "Invalid credentials" error, see [CIRCLE_AUTH_TROUBLESHOOTING.md](CIRCLE_AUTH_TROUBLESHOOTING.md) for help.

### 2. Create a Wallet (Automatic)

The HALE Oracle backend will automatically create a wallet on first run:

```bash
python3 hale_oracle_backend_circle.py
```

This will:
- Create a new Circle wallet
- Generate an ARC address
- Display the wallet ID and address
- Save the wallet ID to use in future runs

### 3. Create a Wallet (Manual)

Or create manually using the wallet manager:

```bash
python3 circle_wallet_manager.py
```

### 4. Use Existing Wallet

If you already have a Circle wallet, set the wallet ID in `.env`:

```env
CIRCLE_WALLET_ID=your-wallet-id-here
```

### 5. Update Deployment

When deploying the contract, use the Circle wallet address as the oracle:

```bash
# Get wallet address
python3 -c "
from circle_wallet_manager import *
import os
m = CircleWalletManager(os.getenv('CIRCLE_API_KEY'), os.getenv('CIRCLE_ENTITY_SECRET'))
addr = get_wallet_address_for_web3(m, os.getenv('CIRCLE_WALLET_ID'), 'ARC')
print(f'HALE_ORACLE_ADDRESS={addr}')
"

# Add to .env
# HALE_ORACLE_ADDRESS=0xYourCircleWalletAddress
```

Then deploy:

```bash
npm run deploy:testnet
```

## Usage

### Using Circle Wallets in Backend

Use the Circle-integrated backend:

```python
from hale_oracle_backend_circle import HaleOracleCircle

oracle = HaleOracleCircle(
    gemini_api_key=os.getenv('GEMINI_API_KEY'),
    circle_api_key=os.getenv('CIRCLE_API_KEY'),
    circle_entity_secret=os.getenv('CIRCLE_ENTITY_SECRET'),
    circle_wallet_id=os.getenv('CIRCLE_WALLET_ID'),  # Optional
    arc_rpc_url=os.getenv('ARC_TESTNET_RPC_URL')
)
```

### Traditional Wallets (Alternative)

If you prefer traditional wallets with private keys, use the original backend:

```python
from hale_oracle_backend import HaleOracle

oracle = HaleOracle(
    gemini_api_key=os.getenv('GEMINI_API_KEY'),
    arc_rpc_url=os.getenv('ARC_TESTNET_RPC_URL')
)
```

## Wallet Operations

### Check Balance

```python
from circle_wallet_manager import CircleWalletManager
import os

manager = CircleWalletManager(
    os.getenv('CIRCLE_API_KEY'),
    os.getenv('CIRCLE_ENTITY_SECRET')
)

balance = manager.get_balance(os.getenv('CIRCLE_WALLET_ID'))
print(balance)
```

### Get Wallet Address

```python
from circle_wallet_manager import get_wallet_address_for_web3

address = get_wallet_address_for_web3(
    manager,
    os.getenv('CIRCLE_WALLET_ID'),
    "ARC"
)
print(f"ARC Address: {address}")
```

### Create Transaction

```python
tx = manager.create_transaction(
    wallet_id=os.getenv('CIRCLE_WALLET_ID'),
    destination_address="0xRecipientAddress",
    amount="1000000",  # Amount in smallest unit
    idempotency_key="unique-key-123"
)
```

## Security Best Practices

1. **Never commit credentials**: Keep API keys and secrets in `.env` (already in `.gitignore`)
2. **Use environment variables**: Never hardcode credentials
3. **Rotate keys regularly**: Update API keys periodically
4. **Limit permissions**: Use API keys with minimal required permissions
5. **Monitor usage**: Check Circle Console for unusual activity

## Troubleshooting

### "Entity secret required" error
- Make sure `CIRCLE_ENTITY_SECRET` is set in `.env`
- Verify the secret is correct in Circle Console

### "Wallet not found" error
- Check `CIRCLE_WALLET_ID` is correct
- Verify wallet exists in Circle Console
- Try creating a new wallet

### Transaction failures
- Ensure wallet has sufficient balance
- Check gas prices on Arc network
- Verify contract address is correct
- Check transaction status in Circle Console

## API Documentation

For detailed API documentation, visit:
- Circle Developer Docs: https://developers.circle.com/
- Programmable Wallets: https://developers.circle.com/programmable-wallets

## Migration from Traditional Wallets

If you're currently using traditional wallets and want to migrate:

1. Create Circle wallet (see steps above)
2. Transfer funds from old wallet to Circle wallet
3. Update `HALE_ORACLE_ADDRESS` in contract (requires contract owner)
4. Update backend to use `hale_oracle_backend_circle.py`
5. Test thoroughly on testnet first

## Support

- Circle Support: https://support.circle.com/
- Circle Discord: Check Circle's developer community
- HALE Oracle Issues: Check project repository
