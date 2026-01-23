# Arc Network Information

## Arc Testnet

### Network Details
- **Network Name**: Arc Testnet
- **Chain ID**: `5042002`
- **Currency**: USDC
- **Explorer**: https://testnet.arcscan.app
- **Faucet**: https://faucet.circle.com

### RPC Endpoints

**Primary:**
- HTTPS: `https://rpc.testnet.arc.network`
- WebSocket: `wss://rpc.testnet.arc.network`

**Alternatives:**
- Blockdaemon: `https://rpc.blockdaemon.testnet.arc.network`
- DRPC: `https://rpc.drpc.testnet.arc.network`
- QuickNode: `https://rpc.quicknode.testnet.arc.network`

### WebSocket Alternatives
- DRPC: `wss://rpc.drpc.testnet.arc.network`
- QuickNode: `wss://rpc.quicknode.testnet.arc.network`

## Arc Mainnet

### Network Details
- **Network Name**: Arc Mainnet
- **Chain ID**: TBD (update when available)
- **Currency**: USDC
- **Explorer**: TBD
- **RPC**: TBD

## Configuration

### For Hardhat
Update `hardhat.config.js` or use environment variables:

```javascript
arcTestnet: {
  url: "https://rpc.testnet.arc.network",
  chainId: 5042002,
  accounts: [process.env.PRIVATE_KEY]
}
```

### For .env File
```env
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ARC_TESTNET_CHAIN_ID=5042002
```

## Getting Testnet Tokens

1. Visit the faucet: https://faucet.circle.com
2. Connect your wallet
3. Request testnet USDC
4. Wait for tokens to arrive (usually instant)

## Useful Links

- **Testnet Explorer**: https://testnet.arcscan.app
- **Faucet**: https://faucet.circle.com
- **Documentation**: Check Arc network docs for latest info

## Deployment Commands

```bash
# Deploy to testnet
npm run deploy:testnet

# Verify contract on testnet
npx hardhat verify --network arcTestnet <CONTRACT_ADDRESS> <ORACLE_ADDRESS>

# Check contract state
npx hardhat run scripts/checkContract.js --network arcTestnet
```

## Notes

- Always test on testnet before mainnet
- Testnet tokens have no real value
- Keep your private keys secure
- Monitor gas prices (USDC on Arc)
