# 💰 Paymaster Setup Guide

## Overview

The Paymaster allows the HALE Oracle to execute transactions **without holding native currency (ETH)**. Sponsors deposit funds into the paymaster, and the paymaster pays for oracle transaction gas fees.

**Note:** For USDC-based payments, see [USDC_PAYMASTER_SETUP.md](USDC_PAYMASTER_SETUP.md)

## Architecture

```
Sponsor → Deposits ETH → Paymaster Contract
                              ↓
Oracle → Calls sponsorTransaction() → Paymaster pays gas → Escrow Contract
```

## Benefits

- ✅ **Oracle doesn't need ETH** - No need to fund oracle wallet
- ✅ **Sponsored transactions** - Sponsors pay for gas
- ✅ **Centralized management** - Easy to track and manage gas costs
- ✅ **Flexible** - Multiple sponsors can contribute

---

## Deployment

### 1. Deploy Paymaster Contract

```bash
npx hardhat run scripts/deploy_paymaster.js --network arcTestnet
```

**Output:**
```
✅ Paymaster deployed to: 0x...
```

**Add to .env:**
```bash
PAYMASTER_ADDRESS=0x...
```

### 2. Authorize Oracle

```bash
npx hardhat run scripts/authorize_oracle_paymaster.js --network arcTestnet
```

**Required in .env:**
```bash
ORACLE_ADDRESS=0x...  # Your oracle address
```

### 3. Deposit Funds

```bash
# Set deposit amount (optional, defaults to 0.1 ETH)
export PAYMASTER_DEPOSIT_AMOUNT=0.5

npx hardhat run scripts/deposit_paymaster.js --network arcTestnet
```

---

## Usage

### Oracle Using Paymaster

Instead of using `scripts/release_funds.py`, use:

```bash
python scripts/release_funds_paymaster.py
```

**Required in .env:**
```bash
PAYMASTER_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...
ESCROW_CONTRACT_ADDRESS=0x...
SELLER_ADDRESS=0x...
TRANSACTION_ID=tx_0x123abc_arc
```

### How It Works

1. **Oracle calls** `paymaster.sponsorTransaction()`
2. **Paymaster validates** oracle is authorized
3. **Paymaster executes** the target contract call
4. **Paymaster pays** for gas from its balance
5. **Transaction completes** without oracle needing ETH

---

## Contract Functions

### Paymaster Contract

#### For Sponsors
- `deposit()` - Deposit ETH to sponsor transactions
- `withdraw(uint256 amount)` - Withdraw sponsored funds

#### For Owner
- `authorizeOracle(address oracle)` - Authorize oracle
- `revokeOracle(address oracle)` - Revoke oracle
- `setMaxGasPerTransaction(uint256 maxGas)` - Set gas limit

#### For Oracle
- `sponsorTransaction(address target, bytes data, uint256 gasLimit)` - Sponsor transaction

#### View Functions
- `totalBalance()` - Total paymaster balance
- `getSponsorBalance(address sponsor)` - Sponsor's balance
- `isOracleAuthorized(address oracle)` - Check authorization
- `getPaymasterInfo()` - Get paymaster info

---

## Python Integration

### Using PaymasterManager

```python
from web3 import Web3
from paymaster_manager import PaymasterManager
import json

# Connect to network
w3 = Web3(Web3.HTTPProvider('https://rpc.testnet.arc.network'))

# Load ABIs
with open('paymaster_abi.json', 'r') as f:
    paymaster_abi = json.load(f)

with open('escrow_abi.json', 'r') as f:
    escrow_abi = json.load(f)

# Initialize paymaster
paymaster = PaymasterManager(
    web3=w3,
    paymaster_address='0x...',
    paymaster_abi=paymaster_abi
)

# Sponsor a release transaction
result = paymaster.sponsor_transaction(
    oracle_address='0x...',
    target_contract='0x...',  # Escrow contract
    function_name='release',
    function_args=('0xSellerAddress', 'tx_0x123abc_arc'),
    contract_abi=escrow_abi,
    gas_limit=150000
)

if result['success']:
    print(f"Transaction: {result['tx_hash']}")
```

---

## Relay Paymaster (Alternative)

For a relay-based approach where a relayer executes transactions:

### Deploy Relay Paymaster

```javascript
const RelayPaymaster = await ethers.getContractFactory("RelayPaymaster");
const relayPaymaster = await RelayPaymaster.deploy();
```

### Benefits
- Oracle doesn't need to sign transactions
- Relayer gets fee for executing
- More flexible for off-chain oracles

---

## Environment Variables

Add to `.env`:

```bash
# Paymaster
PAYMASTER_ADDRESS=0x...
PAYMASTER_DEPOSIT_AMOUNT=0.5  # Optional, defaults to 0.1

# Oracle (for paymaster usage)
ORACLE_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...

# Escrow
ESCROW_CONTRACT_ADDRESS=0x...

# Network
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

---

## Monitoring

### Check Paymaster Balance

```javascript
const balance = await paymaster.totalBalance();
console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
```

### Check Oracle Authorization

```javascript
const authorized = await paymaster.isOracleAuthorized(oracleAddress);
console.log(`Authorized: ${authorized}`);
```

### Get Paymaster Info

```javascript
const info = await paymaster.getPaymasterInfo();
console.log(`Balance: ${ethers.formatEther(info.balance)} ETH`);
console.log(`Max Gas: ${info.maxGas}`);
console.log(`Owner: ${info.owner}`);
```

---

## Security Considerations

1. **Oracle Authorization** - Only authorized oracles can use paymaster
2. **Gas Limits** - Maximum gas per transaction prevents abuse
3. **Transaction Replay** - Transaction hashes prevent double-spending
4. **Balance Checks** - Paymaster checks balance before sponsoring
5. **Owner Controls** - Owner can revoke oracles if needed

---

## Troubleshooting

### "Oracle not authorized"
**Solution:** Run `authorize_oracle_paymaster.js` script

### "Insufficient balance"
**Solution:** Deposit more funds to paymaster

### "Gas limit exceeded"
**Solution:** Owner can increase `maxGasPerTransaction`

### "Transaction already sponsored"
**Solution:** Use a different transaction ID or wait for next block

---

## Cost Management

### Estimating Costs

- Average release transaction: ~100,000 gas
- Average refund transaction: ~150,000 gas (multiple transfers)
- Gas price varies by network

### Example Calculation

If gas price is 20 gwei:
- Release: 100,000 * 20 gwei = 0.002 ETH
- Refund: 150,000 * 20 gwei = 0.003 ETH

**Recommendation:** Deposit at least 0.1-0.5 ETH to cover multiple transactions.

---

## Best Practices

1. **Monitor Balance** - Check paymaster balance regularly
2. **Set Gas Limits** - Configure appropriate max gas limits
3. **Multiple Sponsors** - Allow multiple sponsors to contribute
4. **Regular Deposits** - Top up paymaster as needed
5. **Track Usage** - Monitor sponsored transactions

---

## Next Steps

1. ✅ Deploy paymaster contract
2. ✅ Authorize oracle address
3. ✅ Deposit funds
4. ✅ Update oracle scripts to use paymaster
5. ✅ Test release/refund transactions
6. ✅ Monitor balance and usage

---

## Files

- `contracts/Paymaster.sol` - Main paymaster contract
- `contracts/RelayPaymaster.sol` - Relay-based paymaster
- `paymaster_manager.py` - Python paymaster manager
- `scripts/deploy_paymaster.js` - Deploy script
- `scripts/authorize_oracle_paymaster.js` - Authorize oracle
- `scripts/deposit_paymaster.js` - Deposit funds
- `scripts/release_funds_paymaster.py` - Release using paymaster

---

**Your oracle can now operate without holding native currency!** 🚀
