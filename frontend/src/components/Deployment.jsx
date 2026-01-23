import React, { useState } from 'react'
import { Zap, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { ethers } from 'ethers'

function Deployment() {
  const [oracleAddress, setOracleAddress] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [deployed, setDeployed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const escrowABI = [
    "constructor(address _oracle)",
    "function deposit(address seller) payable",
    "function release(address seller, string memory transactionId)",
    "function refund(address seller, string memory reason)",
    "function getBalance(address seller) view returns (uint256)",
    "function getDepositors(address seller) view returns (tuple(address depositor, uint256 amount)[])",
    "event Deposit(address indexed seller, address indexed depositor, uint256 amount)",
    "event Release(address indexed seller, uint256 amount, string transactionId)",
    "event Withdrawal(address indexed depositor, uint256 amount, string reason)"
  ]

  const handleDeploy = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // Set user address as oracle (for demo purposes)
      // In production, you'd deploy a separate oracle contract
      setOracleAddress(userAddress)

      // For now, we'll show instructions since we need the compiled contract
      setError('Contract deployment requires compiled bytecode. See instructions below.')
      setDeployed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="deployment-page">
      <div className="page-header">
        <Zap className="page-icon" size={32} />
        <div>
          <h1>Deploy Oracle</h1>
          <p className="page-subtitle">
            Deploy the HALE Oracle escrow contract to Circle Arc network. 
            Configure your oracle address and start accepting verifications.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <Zap size={24} />
          <h2 className="card-title">Deploy Escrow Contract</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Oracle Address</label>
          <input
            type="text"
            className="form-input"
            value={oracleAddress}
            onChange={(e) => setOracleAddress(e.target.value)}
            placeholder="0x..."
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
            The address that will be authorized to call release/refund functions
          </small>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleDeploy}
          disabled={loading || !oracleAddress}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {loading ? 'Deploying...' : 'Deploy Contract'}
        </button>

        {deployed && contractAddress && (
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            <Check size={20} />
            Contract deployed at: {contractAddress}
            <a 
              href={`https://testnet.arcscan.app/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: '0.5rem', color: 'inherit' }}
            >
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Deployment Instructions</h2>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Using Hardhat</h3>
            <div className="code-block">
              <pre>{`// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const HALE_ORACLE_ADDRESS = process.env.HALE_ORACLE_ADDRESS;
  
  if (!HALE_ORACLE_ADDRESS) {
    throw new Error("HALE_ORACLE_ADDRESS not set");
  }

  const Escrow = await hre.ethers.getContractFactory("ArcFuseEscrow");
  const escrow = await Escrow.deploy(HALE_ORACLE_ADDRESS);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("Escrow deployed to:", address);
  console.log("Oracle address:", HALE_ORACLE_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`}</pre>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(`// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const HALE_ORACLE_ADDRESS = process.env.HALE_ORACLE_ADDRESS;
  
  if (!HALE_ORACLE_ADDRESS) {
    throw new Error("HALE_ORACLE_ADDRESS not set");
  }

  const Escrow = await hre.ethers.getContractFactory("ArcFuseEscrow");
  const escrow = await Escrow.deploy(HALE_ORACLE_ADDRESS);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("Escrow deployed to:", address);
  console.log("Oracle address:", HALE_ORACLE_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`)}
              style={{ marginTop: '0.5rem' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              Copy Script
            </button>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Using Foundry</h3>
            <div className="code-block">
              <pre>{`// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ArcFuseEscrow} from "../src/ArcFuseEscrow.sol";

contract DeployScript is Script {
    function run() external {
        address oracle = vm.envAddress("HALE_ORACLE_ADDRESS");
        
        vm.startBroadcast();
        ArcFuseEscrow escrow = new ArcFuseEscrow(oracle);
        vm.stopBroadcast();
        
        console.log("Escrow deployed to:", address(escrow));
        console.log("Oracle address:", oracle);
    }
}`}</pre>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(`// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ArcFuseEscrow} from "../src/ArcFuseEscrow.sol";

contract DeployScript is Script {
    function run() external {
        address oracle = vm.envAddress("HALE_ORACLE_ADDRESS");
        
        vm.startBroadcast();
        ArcFuseEscrow escrow = new ArcFuseEscrow(oracle);
        vm.stopBroadcast();
        
        console.log("Escrow deployed to:", address(escrow));
        console.log("Oracle address:", oracle);
    }
}`)}
              style={{ marginTop: '0.5rem' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              Copy Script
            </button>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Contract ABI</h3>
            <div className="code-block">
              <pre>{JSON.stringify(escrowABI, null, 2)}</pre>
            </div>
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
              Full ABI available in escrow_abi.json
            </small>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Configuration</h2>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Network Settings</h3>
            <div className="code-block">
              <pre>{`// hardhat.config.js
module.exports = {
  networks: {
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      chainId: 11155111, // Update with actual Arc testnet chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};`}</pre>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Environment Variables</h3>
            <div className="code-block">
              <pre>{`.env
HALE_ORACLE_ADDRESS=0x...
PRIVATE_KEY=0x...
ARC_RPC_URL=https://rpc.testnet.arc.network`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Deployment
