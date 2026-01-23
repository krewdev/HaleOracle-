# 💰 HALE Oracle Escrow Service - Demo Guide

## Overview

The escrow service demonstrates the complete trustless workflow:
1. **Buyers deposit funds** into escrow for a seller
2. **Seller delivers work** (code, content, etc.)
3. **HALE Oracle verifies** the delivery using AI
4. **Funds are automatically released** (PASS) or **refunded** (FAIL)

---

## Quick Demo (5 minutes)

### Prerequisites

1. **Deployed contract address** on Arc Testnet
2. **Oracle wallet** with private key (for calling release/refund)
3. **Test wallets** (buyer and seller addresses)
4. **Testnet ETH** for gas fees

### Demo Flow

#### 1. Show Contract on Explorer (30 seconds)

**Open:** `https://testnet.arcscan.app/address/YOUR_CONTRACT_ADDRESS`

**What to highlight:**
- ✅ Contract is deployed and verified
- ✅ Oracle address is set
- ✅ Contract holds funds securely
- ✅ All transactions are transparent

**What to say:**
> "This is our escrow contract deployed on Arc Testnet. It's a smart contract that holds funds until the oracle verifies the delivery."

---

#### 2. Deposit Funds (1 minute)

**Method A: Using Frontend (if you have a deposit UI)**
- Navigate to deposit section
- Enter seller address
- Enter amount (e.g., 0.01 ETH)
- Click deposit
- Show transaction on explorer

**Method B: Using Script (see scripts below)**

**What to show:**
- Transaction hash on explorer
- Deposit event emitted
- Balance updated in contract

**What to say:**
> "A buyer deposits funds into escrow for a specific seller. The contract holds these funds securely. Notice how the deposit is recorded on-chain with an event."

---

#### 3. Verify Delivery (1.5 minutes)

**Using Frontend:**
1. Go to verification form
2. Enter contract terms and delivery
3. Click "Verify Delivery"
4. Show PASS result

**What to highlight:**
- Oracle analyzes the delivery
- Provides verdict with reasoning
- Confidence score
- Decision to release funds

**What to say:**
> "The oracle uses AI to verify the delivery against the contract terms. It checks security, compliance, and quality. In this case, it passed with 98% confidence, so funds will be released."

---

#### 4. Release Funds (1 minute)

**Show:**
- Oracle triggers `release()` function
- Transaction on explorer
- Funds transferred to seller
- Balance in contract becomes 0

**What to say:**
> "Because the verification passed, the oracle automatically calls the release function. The funds are transferred to the seller, and the escrow balance is cleared. All of this happens automatically - no human intervention needed."

---

#### 5. Show Refund Scenario (1 minute)

**Explain:**
- What happens when verification fails
- Oracle calls `refund()` function
- Funds go back to buyers proportionally
- Show the difference between release and refund

**What to say:**
> "If verification fails, the oracle calls refund instead. Funds are returned to the buyers proportionally. This protects buyers from bad deliveries."

---

## Full Demo Script (10 minutes)

### Part 1: The Escrow Contract (2 min)

**Show:**
- Contract code (key functions)
- Explain the workflow
- Show contract on explorer

**Say:**
> "The escrow contract is the trust layer. It holds funds until verification. Only the oracle can release or refund. This eliminates the need for trust between parties."

---

### Part 2: Deposit Workflow (2 min)

**Do:**
1. Show buyer wallet balance
2. Make a deposit transaction
3. Show transaction on explorer
4. Check contract balance

**Say:**
> "Buyers deposit funds for a seller. The contract tracks who deposited what. Up to 3 buyers can pool funds for one seller - this enables group purchases."

---

### Part 3: Verification & Release (3 min)

**Do:**
1. Show delivery being verified
2. Show oracle verdict (PASS)
3. Trigger release transaction
4. Show funds transferred to seller
5. Verify seller balance increased

**Say:**
> "The oracle verifies the delivery. If it passes, it automatically releases funds. The entire process is automated and trustless."

---

### Part 4: Refund Scenario (2 min)

**Do:**
1. Show a FAIL verification
2. Explain why it failed
3. Show refund transaction
4. Verify buyers got refunded

**Say:**
> "If verification fails, funds are automatically refunded. Buyers are protected from bad deliveries, and sellers are incentivized to meet the contract terms."

---

### Part 5: Multi-Buyer Feature (1 min)

**Show:**
- Multiple deposits for same seller
- Show depositor list
- Explain proportional refunds

**Say:**
> "The contract supports up to 3 buyers per seller. When refunding, each buyer gets back exactly what they deposited. This enables group purchases and shared escrows."

---

## Demo Scripts

### Script 1: Deposit Funds

```javascript
// deposit.js
const { ethers } = require("ethers");
require("dotenv").config();

async function deposit() {
  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BUYER_PRIVATE_KEY, provider);
  
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const escrowABI = require("../escrow_abi.json");
  const escrow = new ethers.Contract(escrowAddress, escrowABI, wallet);
  
  const sellerAddress = process.env.SELLER_ADDRESS;
  const amount = ethers.parseEther("0.01"); // 0.01 ETH
  
  console.log(`Depositing ${ethers.formatEther(amount)} ETH for seller ${sellerAddress}...`);
  
  const tx = await escrow.deposit(sellerAddress, { value: amount });
  console.log(`Transaction hash: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`✅ Deposit confirmed in block ${receipt.blockNumber}`);
  
  // Check balance
  const balance = await escrow.deposits(sellerAddress);
  console.log(`Escrow balance: ${ethers.formatEther(balance)} ETH`);
}

deposit().catch(console.error);
```

---

### Script 2: Check Balance

```javascript
// checkBalance.js
const { ethers } = require("ethers");
require("dotenv").config();

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL);
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const escrowABI = require("../escrow_abi.json");
  const escrow = new ethers.Contract(escrowAddress, escrowABI, provider);
  
  const sellerAddress = process.env.SELLER_ADDRESS;
  
  const balance = await escrow.deposits(sellerAddress);
  const depositorCount = await escrow.getDepositorCount(sellerAddress);
  const depositors = await escrow.getDepositors(sellerAddress);
  
  console.log(`\n📊 Escrow Status for ${sellerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Depositors: ${depositorCount}`);
  
  if (depositors.length > 0) {
    console.log(`\nDepositor Details:`);
    depositors.forEach((dep, i) => {
      console.log(`  ${i + 1}. ${dep.depositor}: ${ethers.formatEther(dep.amount)} ETH`);
    });
  }
}

checkBalance().catch(console.error);
```

---

### Script 3: Release Funds (Oracle)

```python
# release_funds.py
import os
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import json

load_dotenv()

def release_funds(seller_address, transaction_id):
    # Connect to Arc
    rpc_url = os.getenv('ARC_TESTNET_RPC_URL')
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    # Load contract
    contract_address = os.getenv('ESCROW_CONTRACT_ADDRESS')
    with open('escrow_abi.json', 'r') as f:
        abi = json.load(f)
    
    contract = w3.eth.contract(address=contract_address, abi=abi)
    
    # Get oracle account
    oracle_key = os.getenv('ORACLE_PRIVATE_KEY')
    oracle_account = Account.from_key(oracle_key)
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(oracle_account.address)
    gas_price = w3.eth.gas_price
    
    tx = contract.functions.release(
        Web3.to_checksum_address(seller_address),
        transaction_id
    ).build_transaction({
        'from': oracle_account.address,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': gas_price,
        'chainId': 11155111  # Update with actual Arc chain ID
    })
    
    # Sign and send
    signed_tx = oracle_account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"✅ Release transaction: {tx_hash.hex()}")
    
    # Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"✅ Confirmed in block {receipt.blockNumber}")
    
    return tx_hash.hex()

if __name__ == '__main__':
    seller = os.getenv('SELLER_ADDRESS')
    tx_id = 'tx_0x123abc_arc'
    release_funds(seller, tx_id)
```

---

### Script 4: Refund Funds (Oracle)

```python
# refund_funds.py
import os
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import json

load_dotenv()

def refund_funds(seller_address, reason):
    # Connect to Arc
    rpc_url = os.getenv('ARC_TESTNET_RPC_URL')
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    # Load contract
    contract_address = os.getenv('ESCROW_CONTRACT_ADDRESS')
    with open('escrow_abi.json', 'r') as f:
        abi = json.load(f)
    
    contract = w3.eth.contract(address=contract_address, abi=abi)
    
    # Get oracle account
    oracle_key = os.getenv('ORACLE_PRIVATE_KEY')
    oracle_account = Account.from_key(oracle_key)
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(oracle_account.address)
    gas_price = w3.eth.gas_price
    
    tx = contract.functions.refund(
        Web3.to_checksum_address(seller_address),
        reason
    ).build_transaction({
        'from': oracle_account.address,
        'nonce': nonce,
        'gas': 150000,
        'gasPrice': gas_price,
        'chainId': 11155111  # Update with actual Arc chain ID
    })
    
    # Sign and send
    signed_tx = oracle_account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"✅ Refund transaction: {tx_hash.hex()}")
    
    # Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"✅ Confirmed in block {receipt.blockNumber}")
    
    return tx_hash.hex()

if __name__ == '__main__':
    seller = os.getenv('SELLER_ADDRESS')
    reason = 'VERIFICATION_FAILED: Missing error handling'
    refund_funds(seller, reason)
```

---

## Complete Workflow Demo

### Step-by-Step

1. **Setup**
   ```bash
   # Set environment variables
   export ESCROW_CONTRACT_ADDRESS=0x...
   export ORACLE_PRIVATE_KEY=0x...
   export BUYER_PRIVATE_KEY=0x...
   export SELLER_ADDRESS=0x...
   export ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
   ```

2. **Check Initial State**
   ```bash
   node scripts/checkBalance.js
   # Should show: Balance: 0 ETH
   ```

3. **Deposit Funds**
   ```bash
   node scripts/deposit.js
   # Shows transaction hash
   ```

4. **Verify Balance**
   ```bash
   node scripts/checkBalance.js
   # Should show: Balance: 0.01 ETH, Depositors: 1
   ```

5. **Verify Delivery (Frontend)**
   - Go to frontend verification form
   - Enter contract data
   - Get PASS verdict

6. **Release Funds**
   ```bash
   python scripts/release_funds.py
   # Shows release transaction
   ```

7. **Verify Release**
   ```bash
   node scripts/checkBalance.js
   # Should show: Balance: 0 ETH (funds released)
   ```

---

## Visual Demo Flow

### Browser Tabs to Have Open

1. **Contract Explorer**
   - `https://testnet.arcscan.app/address/YOUR_CONTRACT_ADDRESS`
   - Show contract code, events, transactions

2. **Buyer Wallet**
   - `https://testnet.arcscan.app/address/BUYER_ADDRESS`
   - Show balance before/after deposit

3. **Seller Wallet**
   - `https://testnet.arcscan.app/address/SELLER_ADDRESS`
   - Show balance before/after release

4. **Frontend**
   - `http://localhost:3000`
   - Show verification interface

---

## Key Features to Highlight

### 1. Trustless Escrow
- ✅ Funds held in smart contract
- ✅ No third-party custodian
- ✅ Transparent and verifiable

### 2. Oracle-Controlled
- ✅ Only oracle can release/refund
- ✅ Automated based on AI verification
- ✅ No human intervention needed

### 3. Multi-Buyer Support
- ✅ Up to 3 buyers per seller
- ✅ Proportional refunds
- ✅ Group purchases enabled

### 4. Security
- ✅ Transaction ID tracking (prevents double-spending)
- ✅ Access control (only oracle)
- ✅ Reentrancy protection

### 5. Transparency
- ✅ All events on-chain
- ✅ Verifiable on explorer
- ✅ No hidden fees

---

## Talking Points

### Opening
> "The escrow service is the trust layer for HALE Oracle. It holds funds securely until the oracle verifies the delivery. If verification passes, funds go to the seller. If it fails, funds are refunded to buyers. All automated, all trustless."

### During Deposit
> "Buyers deposit funds into the contract. The contract tracks who deposited what. Notice how this is a simple transaction - just send ETH to the contract with the seller's address."

### During Verification
> "The oracle analyzes the delivery. It's checking security, compliance, and quality. This happens in seconds using AI."

### During Release
> "Because verification passed, the oracle automatically releases funds. The seller receives payment, and the escrow is cleared. No manual intervention needed."

### During Refund
> "If verification fails, funds are automatically refunded. Each buyer gets back exactly what they deposited. This protects buyers and incentivizes quality deliveries."

---

## Troubleshooting

### Transaction Fails
- Check you have enough ETH for gas
- Verify contract address is correct
- Check you're on the right network (Arc Testnet)
- Verify oracle address is set correctly

### Can't Release/Refund
- Verify you're using the oracle private key
- Check the oracle address matches contract
- Ensure there are funds in escrow
- Check transaction ID hasn't been used

### Balance Not Updating
- Wait for transaction confirmation
- Check you're querying the correct seller address
- Verify transaction was successful on explorer

---

## Demo Checklist

**Before Demo:**
- [ ] Contract deployed and verified
- [ ] Oracle address set correctly
- [ ] Test wallets funded with testnet ETH
- [ ] Scripts tested and working
- [ ] Explorer links ready
- [ ] Frontend running (for verification)

**During Demo:**
- [ ] Show contract on explorer
- [ ] Make deposit transaction
- [ ] Show balance update
- [ ] Verify delivery (frontend)
- [ ] Release funds
- [ ] Show funds transferred
- [ ] (Optional) Show refund scenario

---

## Quick Reference

### Contract Functions
- `deposit(address seller)` - Deposit funds (payable)
- `release(address seller, string transactionId)` - Release funds (oracle only)
- `refund(address seller, string reason)` - Refund funds (oracle only)
- `deposits(address seller)` - View balance
- `getDepositors(address seller)` - View depositor list

### Events
- `Deposit(address seller, address depositor, uint256 amount)`
- `Release(address seller, uint256 amount, string transactionId)`
- `Withdrawal(address depositor, uint256 amount, string reason)`

---

## Good Luck! 🚀

The escrow service is the foundation of trustless transactions. Show it with confidence!
