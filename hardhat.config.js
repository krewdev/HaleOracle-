require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
// Try to load .env.local if present
require("dotenv").config({ path: ".env.local" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    arc: {
      url: process.env.ARC_RPC_URL || "https://rpc.arc.xyz",
      chainId: parseInt(process.env.ARC_CHAIN_ID || "12345"),
      accounts: (() => {
        // Prefer ORACLE_PRIVATE_KEY (64 chars), fallback to PRIVATE_KEY if valid
        let pk = process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
        if (!pk) return [];
        // Remove 0x if present, then add it back
        pk = pk.replace(/^0x/, '');
        // Only use if it's 64 hex characters (32 bytes)
        if (pk.length !== 64) {
          return [];
        }
        return ['0x' + pk];
      })(),
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      chainId: parseInt(process.env.ARC_TESTNET_CHAIN_ID || "5042002"),
      accounts: (() => {
        // Prefer ORACLE_PRIVATE_KEY (64 chars), fallback to PRIVATE_KEY if valid
        let pk = process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
        if (!pk) return [];
        // Remove 0x if present, then add it back
        pk = pk.replace(/^0x/, '');
        // Only use if it's 64 hex characters (32 bytes)
        if (pk.length !== 64) {
          return [];
        }
        return ['0x' + pk];
      })(),
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: (() => {
        let pk = process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
        if (!pk) return [];
        pk = pk.replace(/^0x/, '');
        if (pk.length !== 64) {
          return [];
        }
        return ['0x' + pk];
      })(),
    },
  },
  etherscan: {
    apiKey: {
      arc: process.env.ARC_EXPLORER_API_KEY || "no-api-key-needed",
      arcTestnet: process.env.ARC_EXPLORER_API_KEY || "no-api-key-needed",
      sepolia: process.env.ETHERSCAN_API_KEY || "no-api-key-needed",
    },
    customChains: [
      {
        network: "arc",
        chainId: parseInt(process.env.ARC_CHAIN_ID || "12345"),
        urls: {
          apiURL: "https://api.explorer.arc.xyz/api",
          browserURL: "https://explorer.arc.xyz",
        },
      },
      {
        network: "arcTestnet",
        chainId: parseInt(process.env.ARC_TESTNET_CHAIN_ID || "5042002"),
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
    ],
  },
  sourcify: {
    enabled: false, // Disable Sourcify to hide warning
  },
};
