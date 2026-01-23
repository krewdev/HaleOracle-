# USDC Token Addresses

## Testnet Addresses

### Sepolia Testnet
```
USDC_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

### Arc Testnet
```
USDC_TOKEN_ADDRESS=0x3600000000000000000000000000000000000000
```

**Note:** On Arc network, USDC is the native currency, but you may still need a token contract address for ERC20 operations.

## Mainnet Addresses

### Ethereum Mainnet
```
USDC_TOKEN_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

### Arc Mainnet
```
USDC_TOKEN_ADDRESS=0x...  # Update when Arc mainnet launches
```

## Usage

Add to your `.env` file:

```bash
# For Sepolia testing
USDC_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# For Arc Testnet (update with actual address)
# USDC_TOKEN_ADDRESS=0x...
```

## Verification

To verify a USDC token address:

1. Check on block explorer:
   - Sepolia: https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
   - Arc Testnet: https://testnet.arcscan.app/address/0x...

2. Verify it's an ERC20 token with:
   - `decimals()` returns `6`
   - `symbol()` returns `USDC`
   - `name()` returns `USD Coin`

## Notes

- USDC uses 6 decimals (not 18 like ETH)
- Always verify addresses before using in production
- Testnet addresses may differ from mainnet
