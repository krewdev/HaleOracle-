# 🧪 Testing and Verifying Smart Contracts

Complete guide for testing and verifying HALE Oracle smart contracts.

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx hardhat test test/ArcFuseEscrow.test.js
npx hardhat test test/Escrow.test.js
```

### Compile Contracts
```bash
npm run compile
```

---

## Testing Guide

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup** (optional for local tests)
   ```bash
   # .env file (only needed for deployment/verification)
   ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
   ARC_TESTNET_CHAIN_ID=5042002
   ORACLE_PRIVATE_KEY=0x...
   ```

### Running Tests

#### All Tests
```bash
npm test
# or
npx hardhat test
```

#### Specific Test File
```bash
# Test ArcFuseEscrow contract
npx hardhat test test/ArcFuseEscrow.test.js

# Test Escrow contract
npx hardhat test test/Escrow.test.js
```

#### Specific Test Case
```bash
# Run only "Deposit" tests
npx hardhat test --grep "Deposit"

# Run only "Release" tests
npx hardhat test --grep "Release"
```

#### With Gas Reporting
```bash
REPORT_GAS=true npx hardhat test
```

#### With Coverage
```bash
npx hardhat coverage
```

### Test Structure

#### ArcFuseEscrow Tests
- ✅ Deployment tests
- ✅ Deposit functionality (single, multiple, max 3)
- ✅ Release functionality (oracle only)
- ✅ Refund functionality (proportional to buyers)
- ✅ Access control tests
- ✅ Edge cases

#### Escrow Tests
- ✅ Deployment tests
- ✅ Deposit functionality
- ✅ Release functionality
- ✅ Partial release
- ✅ Oracle update
- ✅ View functions

---

## Test Coverage

### Run Coverage Report
```bash
npx hardhat coverage
```

This will:
1. Run all tests with coverage instrumentation
2. Generate coverage report in `coverage/` directory
3. Show coverage percentages

### View Coverage Report
```bash
# Open in browser
open coverage/index.html
```

---

## Contract Verification

### Prerequisites

1. **Deploy Contract First**
   ```bash
   npm run deploy:testnet
   ```

2. **Get Contract Address**
   - Note the deployed address from deployment output
   - Or check `scripts/deploy.js` output

3. **Set Environment Variables**
   ```bash
   ESCROW_CONTRACT_ADDRESS=0x...
   ORACLE_ADDRESS=0x...
   ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
   ARC_TESTNET_CHAIN_ID=5042002
   ```

### Verification Methods

#### Method 1: Hardhat Verify (Recommended)

**For ArcFuseEscrow:**
```bash
npx hardhat verify \
  --network arcTestnet \
  <CONTRACT_ADDRESS> \
  <ORACLE_ADDRESS>
```

**Example:**
```bash
npx hardhat verify \
  --network arcTestnet \
  0xB47952F4897cE753d972A8929621F816dcb03e63 \
  0x1f3543A5D1BAc29B381d3C2A4A1A88E2eA24Ba66
```

#### Method 2: Manual Verification on Explorer

1. **Go to Contract on Explorer**
   ```
   https://testnet.arcscan.app/address/YOUR_CONTRACT_ADDRESS
   ```

2. **Click "Contract" Tab**

3. **Click "Verify and Publish"**

4. **Select Verification Type:**
   - **Standard JSON Input** (recommended)
   - **Flattened Source Code**

5. **Upload Files:**
   - Contract source code
   - Compiler version (0.8.20)
   - Optimization: Enabled, 200 runs
   - Constructor arguments (oracle address)

6. **Submit**

#### Method 3: Using Verification Script

Create `scripts/verify.js`:
```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const oracleAddress = process.env.ORACLE_ADDRESS;
  
  if (!contractAddress || !oracleAddress) {
    console.error("Set ESCROW_CONTRACT_ADDRESS and ORACLE_ADDRESS in .env");
    process.exit(1);
  }
  
  console.log(`Verifying contract at ${contractAddress}...`);
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [oracleAddress],
      network: "arcTestnet"
    });
    
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run:
```bash
node scripts/verify.js
```

---

## Testing Workflow

### 1. Local Testing (Hardhat Network)

**Fastest, no network needed:**
```bash
npm test
```

**What it tests:**
- All contract functionality
- Access control
- Edge cases
- Gas usage (if REPORT_GAS=true)

### 2. Fork Testing (Testnet Fork)

**Test against real testnet state:**
```bash
# Add to hardhat.config.js
networks: {
  hardhat: {
    forking: {
      url: process.env.ARC_TESTNET_RPC_URL
    }
  }
}
```

Then run tests as normal.

### 3. Testnet Testing

**Deploy to testnet and test:**
```bash
# Deploy
npm run deploy:testnet

# Test with scripts
node scripts/deposit.js
node scripts/checkEscrow.js
python scripts/release_funds.py
```

---

## Test Results Interpretation

### Successful Test Output
```
  ArcFuseEscrow
    Deployment
      ✓ Should set the correct oracle address
      ✓ Should set the correct owner
    Deposit
      ✓ Should allow buyer to deposit funds for seller
      ✓ Should track multiple depositors (up to 3)
      ...
    
  15 passing (2s)
```

### Failed Test Output
```
  1) ArcFuseEscrow
       Deposit
         Should allow buyer to deposit funds for seller:
     Error: Transaction reverted
     ...
```

**Common Issues:**
- Missing environment variables
- Network connection issues
- Insufficient gas
- Wrong contract address

---

## Verification Troubleshooting

### Issue: "Contract already verified"
**Solution:** Contract is already verified. Check explorer.

### Issue: "Constructor arguments mismatch"
**Solution:** 
- Verify oracle address matches deployment
- Check constructor arguments format
- Use `--constructor-args` flag if needed

### Issue: "Network not supported"
**Solution:**
- Check `hardhat.config.js` network configuration
- Verify RPC URL is correct
- Check chain ID matches

### Issue: "API key required"
**Solution:**
- Some networks require API keys
- Check explorer documentation
- May need manual verification

---

## Best Practices

### 1. Test Before Deploy
```bash
# Always run tests before deploying
npm test
```

### 2. Test on Testnet First
```bash
# Deploy to testnet
npm run deploy:testnet

# Test functionality
node scripts/deposit.js
node scripts/checkEscrow.js
```

### 3. Verify After Deploy
```bash
# Verify contract
npx hardhat verify --network arcTestnet <ADDRESS> <ORACLE>
```

### 4. Monitor Gas Usage
```bash
# Run with gas reporting
REPORT_GAS=true npm test
```

### 5. Check Coverage
```bash
# Ensure good test coverage
npx hardhat coverage
# Aim for >80% coverage
```

---

## Test Scripts Reference

### Run All Tests
```bash
npm test
```

### Run with Gas Report
```bash
REPORT_GAS=true npm test
```

### Run with Coverage
```bash
npx hardhat coverage
```

### Run Specific Test
```bash
npx hardhat test test/ArcFuseEscrow.test.js --grep "Deposit"
```

### Compile Only
```bash
npm run compile
```

### Deploy to Testnet
```bash
npm run deploy:testnet
```

### Verify Contract
```bash
npx hardhat verify --network arcTestnet <ADDRESS> <ORACLE>
```

---

## Expected Test Results

### ArcFuseEscrow.test.js
- ✅ 15+ tests passing
- ✅ All deposit scenarios
- ✅ All release scenarios
- ✅ All refund scenarios
- ✅ Access control
- ✅ Edge cases

### Escrow.test.js
- ✅ 10+ tests passing
- ✅ Deposit functionality
- ✅ Release functionality
- ✅ Partial release
- ✅ Oracle update
- ✅ View functions

---

## Continuous Testing

### Watch Mode (if supported)
```bash
# Re-run tests on file changes
npx hardhat test --watch
```

### CI/CD Integration
```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
  
- name: Check coverage
  run: npx hardhat coverage
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run compile` | Compile contracts |
| `npm run deploy:testnet` | Deploy to testnet |
| `npx hardhat verify` | Verify contract |
| `npx hardhat coverage` | Generate coverage report |

---

## Need Help?

- **Tests failing?** Check error messages, verify environment
- **Verification failing?** Try manual verification on explorer
- **Network issues?** Check RPC URL and chain ID
- **Gas issues?** Increase gas limit in config

---

## Good Luck! 🚀

Your contracts are well-tested. Run the tests and verify with confidence!
