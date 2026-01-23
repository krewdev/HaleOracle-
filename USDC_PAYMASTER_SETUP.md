# 💵 USDC Paymaster Setup Guide

## Overview

The USDC Paymaster allows sponsors to deposit **USDC** instead of native currency. The paymaster uses USDC to cover gas costs for oracle transactions, making it easier for sponsors who hold USDC.

## Architecture

```
Sponsor → Deposits USDC → Paymaster Contract
                              ↓
Oracle → Calls sponsorTransaction() → Paymaster pays gas (USDC) → Escrow Contract
                              ↓
Paymaster deducts USDC cost from sponsor balance
```

## How It Works

1. **Sponsors deposit USDC** - Paymaster tracks USDC balances
2. **Oracle calls sponsorTransaction()** - Paymaster executes transaction
3. **Paymaster pays gas** - Uses USDC directly (on Arc network, USDC can be used for gas)
4. **USDC cost deducted** - Based on gas price in USDC

**Note:** On Arc network, USDC is the native currency, so gas can be paid directly in USDC. The paymaster calculates the USDC cost based on gas limit and gas price.

## Benefits

- ✅ **Pay in USDC** - Sponsors use stablecoin instead of volatile native currency
- ✅ **Stable pricing** - USDC provides predictable costs
- ✅ **Easy accounting** - Track costs in USDC
- ✅ **Oracle doesn't need funds** - Still gasless for oracle

---

## Deployment

### 1. Get USDC Token Address

**For Arc Testnet:**
- USDC is the native currency on Arc, but you may still need a token address
- Check Arc documentation for the USDC token contract address

**For Sepolia Testnet (for testing):**
```bash
USDC_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238  # Sepolia USDC
```

**For Arc Testnet:**
```bash
# Add to .env
USDC_TOKEN_ADDRESS=0x3600000000000000000000000000000000000000  # Arc Testnet USDC
```

### 2. Deploy USDC Paymaster

**For Arc Testnet:**
```bash
npm run deploy:usdc-paymaster
```

**For Sepolia Testnet (for testing):**
```bash
npm run deploy:usdc-paymaster:sepolia
```

**Note:** 
- Sepolia USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (for testing)
- Arc Testnet USDC: `0x3600000000000000000000000000000000000000`

**Output:**
```
✅ USDC Paymaster deployed to: 0x...
```

**Add to .env:**
```bash
PAYMASTER_ADDRESS=0x...
```

### 3. Authorize Oracle

```bash
npm run authorize:oracle
```

### 4. Deposit USDC

```bash
# Set amount (optional, defaults to 100 USDC)
export USDC_DEPOSIT_AMOUNT=500

npm run deposit:usdc
```

**Note:** You'll need to approve USDC spending first. The script handles this automatically.

---

## Usage

### Oracle Using USDC Paymaster

The oracle usage is the same - it still calls `sponsorTransaction()`:

```bash
python scripts/release_funds_paymaster.py
```

The paymaster will:
1. Execute the transaction
2. Calculate USDC cost based on gas used and gas price
3. Deduct USDC cost from sponsor balances

---

## Gas Price in USDC

The paymaster uses a gas price denominated in USDC:

- **Default gas price:** 1 (0.000001 USDC per gas unit)
- **Adjustable:** Owner can update gas price based on network conditions

### Setting Gas Price

```javascript
const paymaster = USDCPaymaster.attach(paymasterAddress);
// Set gas price: 1 = 0.000001 USDC per gas unit
// For 100,000 gas: 100,000 * 1 = 0.1 USDC
await paymaster.setGasPriceInUSDC(1);
```

### Example Calculation

If gas limit is 100,000 and gas price is 1 (0.000001 USDC per gas):
- USDC cost = 100,000 * 1 = 0.1 USDC (100,000 * 0.000001 = 0.1)

---

## Contract Functions

### For Sponsors

- `depositUSDC(uint256 amount)` - Deposit USDC (6 decimals)
- `withdrawUSDC(uint256 amount)` - Withdraw USDC

### For Owner

- `authorizeOracle(address oracle)` - Authorize oracle
- `revokeOracle(address oracle)` - Revoke oracle
- `setMaxGasPerTransaction(uint256 maxGas)` - Set gas limit
- `setGasPriceInUSDC(uint256 price)` - Set gas price in USDC

### For Oracle

- `sponsorTransaction(address target, bytes data, uint256 gasLimit)` - Sponsor transaction

### View Functions

- `totalUSDCBalance()` - Total USDC balance
- `getSponsorUSDCBalance(address sponsor)` - Sponsor's USDC balance
- `isOracleAuthorized(address oracle)` - Check authorization
- `getPaymasterInfo()` - Get all paymaster info
- `calculateUSDCost(uint256 gasLimit)` - Calculate USDC cost for gas limit

---

## Environment Variables

Add to `.env`:

```bash
# USDC Paymaster
PAYMASTER_ADDRESS=0x...
USDC_TOKEN_ADDRESS=0x...  # USDC token contract address

# Deposit amount (optional)
USDC_DEPOSIT_AMOUNT=500  # USDC amount (6 decimals)

# Oracle
ORACLE_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...

# Escrow
ESCROW_CONTRACT_ADDRESS=0x...

# Network
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

---

## Python Integration

The `paymaster_manager.py` works the same way - it calls `sponsorTransaction()` which handles USDC internally.

```python
from paymaster_manager import PaymasterManager

# Initialize (same as before)
paymaster = PaymasterManager(
    web3=w3,
    paymaster_address=paymaster_address,
    paymaster_abi=paymaster_abi
)

# Sponsor transaction (USDC cost deducted automatically)
result = paymaster.sponsor_transaction(
    oracle_address=oracle_address,
    target_contract=escrow_address,
    function_name='release',
    function_args=(seller_address, transaction_id),
    contract_abi=escrow_abi
)
```

---

## Monitoring

### Check USDC Balance

```javascript
const usdcBalance = await paymaster.totalUSDCBalance();
console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
```

### Check Gas Price

```javascript
const info = await paymaster.getPaymasterInfo();
console.log(`Gas Price: ${info.gasPrice} (0.000001 USDC per gas unit)`);
console.log(`Max Gas: ${info.maxGas}`);
```

### Check Sponsor Balance

```javascript
const sponsorUSDC = await paymaster.getSponsorUSDCBalance(sponsorAddress);
console.log(`Sponsor USDC: ${ethers.formatUnits(sponsorUSDC, 6)} USDC`);
```

---

## Cost Management

### Estimating Costs

**Gas Usage:**
- Average release: ~100,000 gas
- Average refund: ~150,000 gas

**USDC Costs (based on gas price):**
- If gas price is 1 (0.000001 USDC per gas):
  - Release: 100,000 * 1 = 0.1 USDC
  - Refund: 150,000 * 1 = 0.15 USDC

### Recommended Deposits

- **USDC:** 500-1000 USDC (covers many transactions)

---

## Security Considerations

1. **USDC Approval** - Sponsors must approve USDC spending
2. **Conversion Rate** - Owner should update rate based on market
3. **Dual Balance** - Need both USDC and native currency
4. **Oracle Authorization** - Only authorized oracles can use
5. **Gas Limits** - Maximum gas prevents abuse

---

## Troubleshooting

### "Insufficient USDC balance"
**Solution:** Deposit more USDC to paymaster

### "Insufficient USDC balance"
**Solution:** Deposit more USDC to paymaster

### "USDC transfer failed"
**Solution:** Approve USDC spending first (script does this automatically)

### "Invalid USDC token address"
**Solution:** Verify USDC_TOKEN_ADDRESS is correct for your network

---

## Comparison: Native vs USDC Paymaster

| Feature | Native Paymaster | USDC Paymaster |
|---------|-----------------|----------------|
| Deposit Currency | Native (ETH) | USDC |
| Gas Payment | Native | USDC (on Arc) |
| Cost Tracking | Native | USDC |
| Stability | Volatile | Stable |
| Use Case | Simple | Enterprise/Accounting |
| Native Currency Needed | Yes | No |

---

## Migration from Native Paymaster

If you already have a native paymaster:

1. Deploy USDC paymaster
2. Authorize same oracle
3. Deposit USDC
4. Update scripts to use USDC paymaster address

---

## Next Steps

1. ✅ Deploy USDC paymaster
2. ✅ Authorize oracle
3. ✅ Deposit USDC
4. ✅ Set gas price in USDC (if needed)
5. ✅ Test transactions
6. ✅ Monitor USDC balance

---

## Files

- `contracts/USDCPaymaster.sol` - USDC paymaster contract
- `scripts/deploy_usdc_paymaster.js` - Deploy script
- `scripts/deposit_usdc_paymaster.js` - Deposit USDC
- `scripts/authorize_oracle_paymaster.js` - Authorize oracle (same as before)

---

**Your paymaster now accepts USDC! Sponsors can pay in stablecoin while the oracle operates gaslessly.** 💵🚀
