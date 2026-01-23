// Deploy USDC Paymaster to Sepolia (for testing)
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Sepolia USDC address
  const usdcAddress = process.env.USDC_TOKEN_ADDRESS_SEPOLIA || 
                      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  
  console.log("🚀 Deploying USDC Paymaster to Sepolia Testnet...\n");
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
  console.log(`\nView on explorer: https://sepolia.etherscan.io/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
