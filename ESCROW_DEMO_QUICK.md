# 💰 Escrow Service Demo - Quick Reference

## Complete Workflow

1. **Deposit** → Buyer deposits funds for seller
2. **Verify** → Oracle verifies delivery (frontend)
3. **Release/Refund** → Oracle triggers smart contract
4. **Confirm** → Check balances on explorer

---

## Quick Commands

### Check Escrow Status
```bash
node scripts/checkEscrow.js
```

### Deposit Funds
```bash
node scripts/deposit.js
```

### Release Funds (Oracle)
```bash
python scripts/release_funds.py
```

### Refund Funds (Oracle)
```bash
python scripts/refund_funds.py
```

---

## Environment Variables Needed

```bash
ESCROW_CONTRACT_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...
BUYER_PRIVATE_KEY=0x...
SELLER_ADDRESS=0x...
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
TRANSACTION_ID=tx_0x123abc_arc  # For release
REFUND_REASON=VERIFICATION_FAILED  # For refund
DEPOSIT_AMOUNT=0.01  # ETH amount
```

---

## 5-Minute Demo Flow

1. **Show Contract** (30s)
   - Open explorer: `https://testnet.arcscan.app/address/CONTRACT_ADDRESS`
   - Show contract code, oracle address

2. **Deposit** (1m)
   ```bash
   node scripts/deposit.js
   ```
   - Show transaction on explorer
   - Check balance: `node scripts/checkEscrow.js`

3. **Verify** (1.5m)
   - Use frontend verification form
   - Show PASS result

4. **Release** (1m)
   ```bash
   python scripts/release_funds.py
   ```
   - Show transaction on explorer
   - Verify seller received funds

5. **Refund Demo** (1m)
   - Explain what happens on FAIL
   - Show refund script

---

## Key Talking Points

- ✅ **Trustless** - Funds held in smart contract
- ✅ **Automated** - Oracle triggers release/refund
- ✅ **Transparent** - All on-chain, verifiable
- ✅ **Multi-buyer** - Up to 3 buyers per seller
- ✅ **Secure** - Only oracle can release/refund

---

## Explorer Links

- Contract: `https://testnet.arcscan.app/address/CONTRACT_ADDRESS`
- Buyer: `https://testnet.arcscan.app/address/BUYER_ADDRESS`
- Seller: `https://testnet.arcscan.app/address/SELLER_ADDRESS`
- Oracle: `https://testnet.arcscan.app/address/ORACLE_ADDRESS`

---

## Troubleshooting

**Can't deposit?**
- Check buyer has ETH for gas + deposit
- Verify contract address is correct
- Check seller address is valid

**Can't release/refund?**
- Verify you're using oracle private key
- Check oracle address matches contract
- Ensure funds are in escrow
- Check transaction ID not already used

**Balance not updating?**
- Wait for transaction confirmation
- Refresh explorer page
- Verify correct seller address

---

## Demo Checklist

- [ ] Contract deployed
- [ ] Oracle address set
- [ ] Test wallets funded
- [ ] Scripts tested
- [ ] Explorer links ready
- [ ] Frontend running (for verification)

---

**Full guide:** See `ESCROW_DEMO.md`
