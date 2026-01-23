# HALE Oracle Setup Guide

Complete setup instructions for HALE Oracle.

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed (for smart contracts)
- Git (optional, for cloning)

## Quick Setup

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Node.js Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
cp env.template .env
# Edit .env with your API keys and configuration
```

## Using the Helper Script

For convenience, use the `run.sh` script which automatically:
- Creates virtual environment if needed
- Installs dependencies
- Activates venv
- Runs your Python script

```bash
# Make executable (first time only)
chmod +x run.sh

# Run any Python script
./run.sh hale_oracle_backend.py
./run.sh hale_oracle_backend_circle.py
./run.sh example_usage.py
```

## Manual Activation

If you prefer to activate the virtual environment manually:

```bash
# Activate virtual environment
source venv/bin/activate

# Your prompt should show (venv)
# Now you can run Python scripts:
python3 hale_oracle_backend.py

# Deactivate when done
deactivate
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'google'"

**Solution:** Activate the virtual environment first:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### "externally-managed-environment" error

**Solution:** Use virtual environment (as shown above). Never use `--break-system-packages`.

### Virtual environment not found

**Solution:** Create it:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Node modules issues

**Solution:** Reinstall:
```bash
rm -rf node_modules
npm install
```

## Environment Variables

Required variables in `.env`:

**Minimum for basic operation:**
- `GEMINI_API_KEY` - Google Gemini API key

**For blockchain operations:**
- `ARC_TESTNET_RPC_URL` - Arc testnet RPC
- `ARC_TESTNET_CHAIN_ID` - Arc testnet chain ID (5042002)

**For Circle wallets (recommended):**
- `CIRCLE_API_KEY` - Circle API key
- `CIRCLE_ENTITY_SECRET` - Circle entity secret

**For traditional wallets:**
- `HALE_ORACLE_ADDRESS` - Oracle wallet address
- `ORACLE_PRIVATE_KEY` - Oracle private key

**For contract deployment:**
- `PRIVATE_KEY` - Deployment wallet private key
- `HALE_ORACLE_ADDRESS` - Oracle address for contract

## Verification

Test your setup:

```bash
# Activate venv
source venv/bin/activate

# Test imports
python3 -c "import google.generativeai; print('✅ Gemini OK')"
python3 -c "import web3; print('✅ Web3 OK')"
python3 -c "import circle_wallet_manager; print('✅ Circle OK')"

# Run tests
npm test  # Smart contract tests
python3 example_usage.py  # Backend test
```

## Next Steps

1. Get API keys (Gemini, Circle if using)
2. Configure `.env` file
3. Deploy contract: `npm run deploy:testnet`
4. Test system: `./run.sh example_usage.py`

See [QUICK_START.md](QUICK_START.md) for detailed deployment steps.
