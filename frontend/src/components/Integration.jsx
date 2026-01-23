import React, { useState } from 'react'
import { Code, Copy, Check, Terminal, Package, Globe } from 'lucide-react'

function Integration() {
  const [copied, setCopied] = useState({})

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied({ ...copied, [id]: true })
    setTimeout(() => {
      setCopied({ ...copied, [id]: false })
    }, 2000)
  }

  const integrations = [
    {
      id: 'python',
      title: 'Python Integration',
      icon: Terminal,
      description: 'Integrate HALE Oracle into your Python applications',
      code: `from hale_oracle_backend import HaleOracle
import os

# Initialize oracle
oracle = HaleOracle(
    gemini_api_key=os.getenv('GEMINI_API_KEY'),
    arc_rpc_url=os.getenv('ARC_RPC_URL')
)

# Verify a delivery
contract_data = {
    "transaction_id": "tx_0x123abc_arc",
    "Contract_Terms": "Generate a Python script to fetch USDC price",
    "Acceptance_Criteria": [
        "Must be written in Python 3",
        "Must handle API errors gracefully",
        "Must print the price to console"
    ],
    "Delivery_Content": "import requests\\n\\ndef get_usdc_price():\\n    ..."
}

result = oracle.verify_delivery(contract_data)

if result['verdict'] == 'PASS' and result['release_funds']:
    # Trigger smart contract release
    oracle.trigger_smart_contract(
        verdict=result,
        seller_address="0xSellerAddress",
        contract_address="0xContractAddress"
    )`
    },
    {
      id: 'javascript',
      title: 'JavaScript/Node.js Integration',
      icon: Terminal,
      description: 'Use HALE Oracle in your Node.js applications',
      code: `const axios = require('axios');

async function verifyDelivery(contractData, sellerAddress) {
  try {
    const response = await axios.post('http://localhost:8000/api/verify', {
      contract_data: contractData,
      seller_address: sellerAddress
    });
    
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

// Usage
const contractData = {
  transaction_id: "tx_0x123abc_arc",
  Contract_Terms: "Generate a Python script to fetch USDC price",
  Acceptance_Criteria: [
    "Must be written in Python 3",
    "Must handle API errors gracefully",
    "Must print the price to console"
  ],
  Delivery_Content: "import requests\\n\\ndef get_usdc_price():\\n    ..."
};

const result = await verifyDelivery(contractData, "0xSellerAddress");
console.log('Verdict:', result.verdict);
console.log('Confidence:', result.confidence_score);`
    },
    {
      id: 'web3',
      title: 'Web3 Integration (Ethers.js)',
      icon: Globe,
      description: 'Interact with the escrow contract using Ethers.js',
      code: `import { ethers } from 'ethers';
import escrowABI from './escrow_abi.json';

// Connect to Arc network
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const signer = await provider.getSigner();

// Connect to escrow contract
const escrowAddress = '0x...'; // Your deployed contract address
const escrow = new ethers.Contract(escrowAddress, escrowABI, signer);

// Deposit funds
async function deposit(sellerAddress, amount) {
  const tx = await escrow.deposit(sellerAddress, { value: ethers.parseEther(amount) });
  await tx.wait();
  console.log('Deposit successful:', tx.hash);
}

// Check balance
async function getBalance(sellerAddress) {
  const balance = await escrow.deposits(sellerAddress);
  return ethers.formatEther(balance);
}

// Listen for events
escrow.on('Deposit', (seller, depositor, amount) => {
  console.log('Deposit event:', { seller, depositor, amount: ethers.formatEther(amount) });
});

escrow.on('Release', (seller, amount, transactionId) => {
  console.log('Release event:', { seller, amount: ethers.formatEther(amount), transactionId });
});`
    },
    {
      id: 'agent-wallet',
      title: 'AI Agent Wallet Integration',
      icon: Package,
      description: 'Integrate HALE Oracle into AI agent wallets',
      code: `# Example: AI Agent Wallet Integration
class AgentWallet:
    def __init__(self, oracle_address, contract_address):
        self.oracle = HaleOracle(
            gemini_api_key=os.getenv('GEMINI_API_KEY'),
            arc_rpc_url=os.getenv('ARC_RPC_URL')
        )
        self.contract_address = contract_address
        self.wallet_address = os.getenv('WALLET_ADDRESS')
    
    async def verify_and_pay(self, delivery, contract_terms, acceptance_criteria):
        # Format contract data
        contract_data = {
            "transaction_id": f"tx_{int(time.time())}_arc",
            "Contract_Terms": contract_terms,
            "Acceptance_Criteria": acceptance_criteria,
            "Delivery_Content": delivery
        }
        
        # Verify delivery
        result = self.oracle.verify_delivery(contract_data)
        
        if result['verdict'] == 'PASS' and result['release_funds']:
            # Trigger smart contract release
            success = self.oracle.trigger_smart_contract(
                verdict=result,
                seller_address=self.wallet_address,
                contract_address=self.contract_address
            )
            return {
                'status': 'success',
                'verdict': 'PASS',
                'transaction': success
            }
        else:
            return {
                'status': 'failed',
                'verdict': 'FAIL',
                'reasoning': result['reasoning']
            }

# Usage in agent
wallet = AgentWallet(
    oracle_address="0x...",
    contract_address="0x..."
)

result = await wallet.verify_and_pay(
    delivery=code_delivered,
    contract_terms="Generate Python script",
    acceptance_criteria=["Must be Python 3", "Must handle errors"]
)`
    },
    {
      id: 'rest-api',
      title: 'REST API Integration',
      icon: Globe,
      description: 'Use the REST API endpoint for verification',
      code: `# Python example
import requests

def verify_delivery(contract_data, seller_address=None):
    url = 'http://localhost:8000/api/verify'
    payload = {
        'contract_data': contract_data,
        'seller_address': seller_address
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Usage
contract_data = {
    "transaction_id": "tx_0x123abc_arc",
    "Contract_Terms": "Generate a Python script",
    "Acceptance_Criteria": [
        "Must be written in Python 3",
        "Must handle API errors gracefully"
    ],
    "Delivery_Content": "import requests\\n..."
}

result = verify_delivery(contract_data, "0xSellerAddress")
print(f"Verdict: {result['verdict']}")
print(f"Confidence: {result['confidence_score']}%")`
    },
    {
      id: 'npm-package',
      title: 'NPM Package (Future)',
      icon: Package,
      description: 'Install HALE Oracle as an NPM package',
      code: `# Installation (when published)
npm install @hale-oracle/sdk

# Usage
import { HaleOracle } from '@hale-oracle/sdk';

const oracle = new HaleOracle({
  geminiApiKey: process.env.GEMINI_API_KEY,
  arcRpcUrl: process.env.ARC_RPC_URL
});

const result = await oracle.verify({
  transactionId: 'tx_0x123abc_arc',
  contractTerms: 'Generate a Python script',
  acceptanceCriteria: [
    'Must be written in Python 3',
    'Must handle API errors gracefully'
  ],
  deliveryContent: 'import requests\\n...'
});

console.log('Verdict:', result.verdict);`
    }
  ]

  return (
    <div className="integration-page">
      <div className="page-header">
        <Code className="page-icon" size={32} />
        <div>
          <h1>Integration Guide</h1>
          <p className="page-subtitle">
            Easily integrate HALE Oracle into your projects, AI agent wallets, 
            or any application that needs trustless verification.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Quick Start</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1rem' }}>
          Choose the integration method that best fits your use case. All methods 
          support the same verification functionality.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge-success">Python</span>
          <span className="badge badge-success">JavaScript</span>
          <span className="badge badge-success">Web3</span>
          <span className="badge badge-success">REST API</span>
          <span className="badge badge-warning">NPM (Coming Soon)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {integrations.map((integration) => {
          const Icon = integration.icon

          return (
            <div key={integration.id} className="card">
              <div className="card-header">
                <Icon size={24} />
                <div style={{ flex: 1 }}>
                  <h2 className="card-title">{integration.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {integration.description}
                  </p>
                </div>
              </div>

              <div className="code-block" style={{ position: 'relative' }}>
                <button
                  onClick={() => copyToClipboard(integration.code, integration.id)}
                  className="btn btn-secondary"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {copied[integration.id] ? <Check size={16} /> : <Copy size={16} />}
                  {copied[integration.id] ? 'Copied!' : 'Copy'}
                </button>
                <pre style={{ margin: 0, paddingRight: '100px' }}>
                  <code>{integration.code}</code>
                </pre>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Environment Variables</h2>
        <div className="code-block">
          <pre>{`# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for blockchain interactions)
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CONTRACT_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x...`}</pre>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => copyToClipboard(`# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for blockchain interactions)
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CONTRACT_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x...`, 'env')}
          style={{ marginTop: '0.5rem' }}
        >
          {copied['env'] ? <Check size={16} /> : <Copy size={16} />}
          Copy Environment Template
        </button>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Need Help?</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          Check out the <a href="/docs" style={{ color: 'var(--primary)' }}>Documentation</a> section 
          for detailed guides, or use the <a href="/" style={{ color: 'var(--primary)' }}>Verification Form</a> 
          to test your integration.
        </p>
      </div>
    </div>
  )
}

export default Integration
