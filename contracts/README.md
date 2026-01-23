# Escrow Smart Contract

This directory contains the Solidity smart contract for HALE Oracle's escrow system.

## Contract: Escrow.sol

A production-ready escrow contract that holds funds and releases them based on HALE Oracle verification.

### Features

- **Secure Escrow**: Funds are held securely until HALE Oracle verification
- **Oracle-Controlled Release**: Only the designated HALE Oracle can release funds
- **Transaction Tracking**: Prevents double-spending with transaction ID tracking
- **Partial Payments**: Support for partial fund releases
- **Owner Controls**: Contract owner can update oracle address
- **Event Logging**: Comprehensive events for monitoring and indexing

### Key Functions

#### For Depositors
- `deposit(address seller)`: Deposit funds into escrow for a seller

#### For HALE Oracle
- `release(address seller, string transactionId)`: Release all funds to seller
- `releasePartial(address seller, uint256 amount, string transactionId)`: Release partial funds
- `withdraw(address seller, string reason)`: Withdraw funds (for failed verifications)

#### For Contract Owner
- `updateOracle(address newOracle)`: Update the HALE Oracle address
- `transferOwnership(address newOwner)`: Transfer contract ownership

#### View Functions
- `getBalance(address seller)`: Check escrow balance for a seller
- `isTransactionReleased(string transactionId)`: Check if transaction was processed
- `getSellerTransactions(address seller)`: Get all transaction IDs for a seller
- `getContractInfo()`: Get contract metadata

### Deployment

#### Prerequisites

1. Install Hardhat or Foundry:
   ```bash
   # Hardhat
   npm install --save-dev hardhat
   
   # Or Foundry
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. Get Arc network details (RPC URL, Chain ID, etc.)

#### Hardhat Deployment Script

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const HALE_ORACLE_ADDRESS = process.env.HALE_ORACLE_ADDRESS;
  
  if (!HALE_ORACLE_ADDRESS) {
    throw new Error("HALE_ORACLE_ADDRESS environment variable not set");
  }

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(HALE_ORACLE_ADDRESS);

  await escrow.waitForDeployment();

  console.log("Escrow deployed to:", await escrow.getAddress());
  console.log("Oracle address:", HALE_ORACLE_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### Foundry Deployment Script

```solidity
// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Escrow} from "../src/Escrow.sol";

contract DeployScript is Script {
    function run() external {
        address oracle = vm.envAddress("HALE_ORACLE_ADDRESS");
        
        vm.startBroadcast();
        
        Escrow escrow = new Escrow(oracle);
        
        vm.stopBroadcast();
        
        console.log("Escrow deployed to:", address(escrow));
        console.log("Oracle address:", oracle);
    }
}
```

### Usage Example

```javascript
// Connect to contract
const escrow = await ethers.getContractAt("Escrow", CONTRACT_ADDRESS);

// Deposit funds
await escrow.deposit(SELLER_ADDRESS, { value: ethers.parseEther("1.0") });

// HALE Oracle releases funds (only oracle can call this)
await escrow.release(SELLER_ADDRESS, "tx_0x123abc_arc");

// Check balance
const balance = await escrow.getBalance(SELLER_ADDRESS);
console.log("Escrow balance:", ethers.formatEther(balance));
```

### Security Considerations

1. **Access Control**: Only the HALE Oracle can release funds
2. **Reentrancy Protection**: Uses checks-effects-interactions pattern
3. **Transaction ID Tracking**: Prevents double-spending
4. **Owner Controls**: Owner can update oracle (use multi-sig in production)
5. **Zero Address Checks**: Prevents accidental fund loss

### Testing

Run tests with:

```bash
# Hardhat
npx hardhat test

# Foundry
forge test
```

### Verification

Verify contract on Arc block explorer:

```bash
# Hardhat
npx hardhat verify --network arc <CONTRACT_ADDRESS> <ORACLE_ADDRESS>

# Foundry
forge verify-contract <CONTRACT_ADDRESS> Escrow --chain-id <ARC_CHAIN_ID> --constructor-args $(cast abi-encode "constructor(address)" <ORACLE_ADDRESS>)
```

### ABI Export

Export the ABI for use in HALE Oracle backend:

```bash
# Hardhat
cat artifacts/contracts/Escrow.sol/Escrow.json | jq .abi > escrow_abi.json

# Foundry
forge build
cat out/Escrow.sol/Escrow.json | jq .abi > escrow_abi.json
```

### Events

The contract emits the following events for monitoring:

- `Deposit(address indexed seller, address indexed depositor, uint256 amount)`
- `Release(address indexed seller, uint256 amount, string transactionId)`
- `OracleUpdated(address indexed oldOracle, address indexed newOracle)`
- `Withdrawal(address indexed seller, uint256 amount, string reason)`

### License

MIT
