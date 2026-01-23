#!/bin/bash

# HALE Oracle Deployment Script
# This script helps you deploy the ArcFuseEscrow contract

set -e  # Exit on error

echo "🚀 HALE Oracle Deployment Script"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and fill in your values:"
    echo "   cp .env.example .env"
    echo "   nano .env  # or use your preferred editor"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$HALE_ORACLE_ADDRESS" ]; then
    echo "❌ Error: HALE_ORACLE_ADDRESS not set in .env file"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env file"
    exit 1
fi

# Ask which network to deploy to
echo "Select deployment network:"
echo "1) Testnet (recommended for first deployment)"
echo "2) Mainnet"
read -p "Enter choice [1-2]: " network_choice

case $network_choice in
    1)
        NETWORK="arcTestnet"
        echo "📡 Deploying to TESTNET..."
        ;;
    2)
        NETWORK="arc"
        echo "📡 Deploying to MAINNET..."
        echo "⚠️  WARNING: You are deploying to MAINNET. Make sure you've tested on testnet first!"
        read -p "Continue? [y/N]: " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "Deployment cancelled."
            exit 0
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📋 Deployment Configuration:"
echo "   Network: $NETWORK"
echo "   Oracle Address: $HALE_ORACLE_ADDRESS"
echo ""

# Compile contract
echo "🔨 Compiling contract..."
npm run compile

# Deploy contract
echo ""
echo "🚀 Deploying contract..."
if [ "$NETWORK" == "arcTestnet" ]; then
    npm run deploy:testnet
else
    npm run deploy:mainnet
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update ESCROW_CONTRACT_ADDRESS in your .env file"
echo "2. Verify contract on block explorer (optional)"
echo "3. Test the contract with a small deposit"
echo "4. Update hale_oracle_backend.py with the contract address"
