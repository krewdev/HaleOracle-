# 💰 Paymaster Quick Reference

## Quick Setup

### 1. Deploy
```bash
npm run deploy:paymaster
```

### 2. Authorize Oracle
```bash
npm run authorize:oracle
```

### 3. Deposit Funds
```bash
npm run deposit:paymaster
```

## Usage

### Release Funds (with paymaster)
```bash
python scripts/release_funds_paymaster.py
```

## Environment Variables

```bash
PAYMASTER_ADDRESS=0x...
ORACLE_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...
ESCROW_CONTRACT_ADDRESS=0x...
```

## Benefits

- ✅ Oracle doesn't need ETH
- ✅ Sponsors pay for gas
- ✅ Easy to manage

**Full guide:** See `PAYMASTER_SETUP.md`
