# 🧪 Testing Quick Reference

## Run Tests

```bash
# All tests
npm test

# With gas reporting
npm run test:gas

# With coverage
npm run test:coverage
```

## Verify Contract

```bash
# Set in .env first:
# ESCROW_CONTRACT_ADDRESS=0x...
# ORACLE_ADDRESS=0x...

npm run verify
```

## Test Files

- `test/ArcFuseEscrow.test.js` - Multi-buyer escrow tests
- `test/Escrow.test.js` - Standard escrow tests

## Expected Results

- ✅ 25+ tests passing
- ✅ All functionality covered
- ✅ Access control verified
- ✅ Edge cases tested

## Troubleshooting

**Tests fail?**
- Run `npm install` first
- Check Node.js version (18+)

**Verification fails?**
- Check contract address is correct
- Verify oracle address matches deployment
- Try manual verification on explorer

**Full guide:** See `TEST_AND_VERIFY.md`
