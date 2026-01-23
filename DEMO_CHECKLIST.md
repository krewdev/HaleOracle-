# 🎯 Hackathon Demo Checklist

## Pre-Demo Setup (5 minutes before)

### 1. Test Everything Works
```bash
# Activate environment
source venv/bin/activate

# Test oracle
./run.sh example_usage.py

# Test quick demo
./run.sh demo_quick.py

# Check balance
python3 check_balance.py
```

### 2. Open Browser Tabs
- [ ] Contract Explorer: https://testnet.arcscan.app/address/0xB47952F4897cE753d972A8929621F816dcb03e63
- [ ] Wallet Explorer: https://testnet.arcscan.app/address/0x1f3543A5D1BAc29B381d3C2A4A1A88E2eA24Ba66
- [ ] README.md (for architecture overview)

### 3. Prepare Terminal Windows
- [ ] Terminal 1: Ready with `./run.sh demo_quick.py`
- [ ] Terminal 2: Ready with `python3 check_balance.py`
- [ ] Terminal 3: Ready with `./run.sh example_usage.py` (backup)

### 4. Key Points to Remember
- [ ] Contract address: `0xB47952F4897cE753d972A8929621F816dcb03e63`
- [ ] Oracle address: `0x1f3543A5D1BAc29B381d3C2A4A1A88E2eA24Ba66`
- [ ] Network: Arc Testnet
- [ ] Model: Gemini 2.5 Flash
- [ ] Features: Multi-buyer support, AI verification, automated escrow

## During Demo

### Opening (30 sec)
- [ ] Introduce HALE Oracle
- [ ] Explain the problem (trust in AI agents)
- [ ] Show the solution (automated verification)

### Live Demo (3 min)
- [ ] Run `./run.sh demo_quick.py`
- [ ] Show verification in real-time
- [ ] Explain the verdict and reasoning
- [ ] Show confidence score

### Blockchain (1 min)
- [ ] Open contract on explorer
- [ ] Explain escrow functionality
- [ ] Show wallet balance

### Features (1 min)
- [ ] Multi-buyer support
- [ ] Risk detection
- [ ] Confidence scoring
- [ ] Production-ready

### Closing (30 sec)
- [ ] Summarize key benefits
- [ ] Mention real-world use cases
- [ ] Invite questions

## Backup Plan

If something goes wrong:
1. **Oracle fails**: Use screenshots from previous runs
2. **Internet issues**: Show pre-recorded video
3. **Contract explorer down**: Show contract code instead
4. **Questions you can't answer**: "Great question! Let me check the documentation..."

## Key Talking Points

### Problem
- AI agents need to transact but can't trust each other
- No automated way to verify digital deliveries

### Solution
- AI-powered verification (Gemini)
- Blockchain escrow (Arc)
- Automated release/refund

### Differentiation
- Not just escrow - includes verification
- Not just AI - includes blockchain security
- Production-ready and deployed

### Technical Stack
- Google Gemini 2.5 Flash
- Circle Arc Testnet
- Solidity smart contracts
- Python backend

## Post-Demo

- [ ] Thank judges/audience
- [ ] Be ready for questions
- [ ] Have GitHub link ready
- [ ] Mention next steps (mainnet, integrations)

## Good Luck! 🚀

You've got this! HALE Oracle is amazing - show it with confidence!
