// Authorize oracle in paymaster
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const paymasterAddress = process.env.PAYMASTER_ADDRESS;
  const oracleAddress = process.env.ORACLE_ADDRESS || process.env.HALE_ORACLE_ADDRESS;
  
  if (!paymasterAddress) {
    console.error("ERROR: PAYMASTER_ADDRESS not set in .env");
    process.exit(1);
  }
  
  if (!oracleAddress) {
    console.error("ERROR: ORACLE_ADDRESS or HALE_ORACLE_ADDRESS not set in .env");
    process.exit(1);
  }
  
  console.log(`🔐 Authorizing oracle in paymaster...\n`);
  console.log(`Paymaster: ${paymasterAddress}`);
  console.log(`Oracle: ${oracleAddress}\n`);
  
  const Paymaster = await hre.ethers.getContractFactory("Paymaster");
  const paymaster = Paymaster.attach(paymasterAddress);
  
  const tx = await paymaster.authorizeOracle(oracleAddress);
  console.log(`Transaction submitted: ${tx.hash}`);
  
  await tx.wait();
  console.log(`✅ Oracle authorized successfully!`);
  
  // Verify
  const isAuthorized = await paymaster.isOracleAuthorized(oracleAddress);
  console.log(`Verification: ${isAuthorized ? '✅ Authorized' : '❌ Not authorized'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
