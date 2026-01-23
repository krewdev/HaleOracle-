// Deploy Paymaster contract
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying Paymaster contract...\n");
  
  const Paymaster = await hre.ethers.getContractFactory("Paymaster");
  const paymaster = await Paymaster.deploy();
  
  await paymaster.waitForDeployment();
  const address = await paymaster.getAddress();
  
  console.log("✅ Paymaster deployed to:", address);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Add to .env: PAYMASTER_ADDRESS=${address}`);
  console.log(`2. Authorize oracle: npx hardhat run scripts/authorize_oracle.js --network arcTestnet`);
  console.log(`3. Deposit funds: npx hardhat run scripts/deposit_paymaster.js --network arcTestnet`);
  console.log(`\nView on explorer: https://testnet.arcscan.app/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
