# 💵 USDC Paymaster Quick Reference

## Quick Setup

### 1. Deploy USDC Paymaster

**Arc Testnet:**
```bash
npm run deploy:usdc-paymaster
```

**Sepolia Testnet (for testing):**
```bash
npm run deploy:usdc-paymaster:sepolia
```

### 2. Authorize Oracle
```bash
npm run authorize:oracle
```

### 3. Deposit USDC
```bash
npm run deposit:usdc
```

## Environment Variables

```bash
# USDC Paymaster
PAYMASTER_ADDRESS=0x...
USDC_TOKEN_ADDRESS=0x3600000000000000000000000000000000000000  # Arc Testnet
# For Sepolia: USDC_TOKEN_ADDRESS_SEPOLIA=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# Deposit amount (optional)
USDC_DEPOSIT_AMOUNT=500  # USDC (6 decimals)

# Oracle
ORACLE_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...
```

## Usage

Same as regular paymaster - oracle calls `sponsorTransaction()`:
```bash
python scripts/release_funds_paymaster.py
```

## How It Works

1. **Sponsors deposit USDC** → Tracked in USDC
2. **Oracle calls sponsorTransaction()** → Paymaster executes
3. **Paymaster pays gas** → Uses USDC directly (on Arc network)
4. **USDC cost deducted** → Based on gas price in USDC

## Benefits

- ✅ Pay in USDC (stablecoin)
- ✅ Predictable costs
- ✅ Easy accounting
- ✅ Oracle still gasless

**Full guide:** See `USDC_PAYMASTER_SETUP.md`
