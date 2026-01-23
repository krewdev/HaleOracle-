// Deploy USDC Paymaster contract
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Try to get USDC address from environment
  // Check for network-specific address first, then fallback to generic
  const network = hre.network.name;
  let usdcAddress = process.env.USDC_TOKEN_ADDRESS;
  
  // Network-specific addresses
  if (network === 'sepolia' || network === 'hardhat') {
    usdcAddress = process.env.USDC_TOKEN_ADDRESS_SEPOLIA || 
                  process.env.USDC_TOKEN_ADDRESS ||
                  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // Sepolia default
  }
  
  // Default to Arc Testnet USDC if not set
  if (!usdcAddress && (network === 'arcTestnet' || network === 'arc')) {
    usdcAddress = '0x3600000000000000000000000000000000000000';
    console.log(`Using default Arc Testnet USDC: ${usdcAddress}`);
  }
  
  if (!usdcAddress) {
    console.error("ERROR: USDC_TOKEN_ADDRESS not set in .env");
    console.error("\n   For Sepolia Testnet:");
    console.error("   USDC_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
    console.error("\n   For Arc Testnet:");
    console.error("   USDC_TOKEN_ADDRESS=0x3600000000000000000000000000000000000000");
    process.exit(1);
  }
  
  console.log("🚀 Deploying USDC Paymaster contract...\n");
  console.log(`USDC Token: ${usdcAddress}\n`);
  
  const USDCPaymaster = await hre.ethers.getContractFactory("USDCPaymaster");
  const paymaster = await USDCPaymaster.deploy(usdcAddress);
  
  await paymaster.waitForDeployment();
  const address = await paymaster.getAddress();
  
  console.log("✅ USDC Paymaster deployed to:", address);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Add to .env: PAYMASTER_ADDRESS=${address}`);
  console.log(`2. Authorize oracle: npm run authorize:oracle`);
  console.log(`3. Deposit USDC: npm run deposit:usdc`);
  console.log(`4. (Optional) Adjust gas price: Set gas price in USDC if needed`);
  console.log(`\nView on explorer: https://testnet.arcscan.app/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
