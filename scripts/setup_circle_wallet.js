/**
 * Setup script for Circle Programmable Wallets
 * Creates a new Circle wallet for HALE Oracle or retrieves existing one
 */

const hre = require("hardhat");
require("dotenv").config();

// Note: This is a Node.js script, but Circle wallet operations
// are typically done via their REST API. This script shows the
// integration pattern. For actual implementation, use the Python
// circle_wallet_manager.py module.

async function main() {
  const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
  const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;
  const CIRCLE_WALLET_ID = process.env.CIRCLE_WALLET_ID;

  if (!CIRCLE_API_KEY) {
    console.log("⚠️  CIRCLE_API_KEY not set in .env");
    console.log("   Get your API key from: https://console.circle.com/");
    console.log("   For now, using traditional wallet setup");
    return;
  }

  console.log("🔵 Circle Wallet Setup");
  console.log("======================");
  console.log("");

  if (CIRCLE_WALLET_ID) {
    console.log(`Using existing Circle wallet: ${CIRCLE_WALLET_ID}`);
    console.log("");
    console.log("To get wallet address, use Python script:");
    console.log("  python3 -c \"from circle_wallet_manager import *; import os;");
    console.log("    m = CircleWalletManager(os.getenv('CIRCLE_API_KEY'), os.getenv('CIRCLE_ENTITY_SECRET'));");
    console.log("    addr = get_wallet_address_for_web3(m, '${CIRCLE_WALLET_ID}', 'ARC');");
    console.log("    print(addr)\"");
  } else {
    console.log("To create a new Circle wallet, use the Python script:");
    console.log("  python3 circle_wallet_manager.py");
    console.log("");
    console.log("Or use the HALE Oracle backend which will create one automatically:");
    console.log("  python3 hale_oracle_backend_circle.py");
  }

  console.log("");
  console.log("📝 Next steps:");
  console.log("1. Set CIRCLE_WALLET_ID in .env after wallet creation");
  console.log("2. Use hale_oracle_backend_circle.py instead of hale_oracle_backend.py");
  console.log("3. Update deployment to use Circle wallet address as oracle");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
