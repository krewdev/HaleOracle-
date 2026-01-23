// Verify deployed contract on Arc Testnet
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const oracleAddress = process.env.ORACLE_ADDRESS || process.env.HALE_ORACLE_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ ERROR: ESCROW_CONTRACT_ADDRESS not set in .env");
    console.error("   Set it to your deployed contract address");
    process.exit(1);
  }
  
  if (!oracleAddress) {
    console.error("❌ ERROR: ORACLE_ADDRESS or HALE_ORACLE_ADDRESS not set in .env");
    console.error("   Set it to the oracle address used in constructor");
    process.exit(1);
  }
  
  console.log("\n🔍 Verifying contract...");
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   Oracle: ${oracleAddress}`);
  console.log(`   Network: arcTestnet\n`);
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [oracleAddress],
      network: "arcTestnet"
    });
    
    console.log("\n✅ Contract verified successfully!");
    console.log(`   View on explorer: https://testnet.arcscan.app/address/${contractAddress}`);
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log("\n✅ Contract already verified!");
      console.log(`   View on explorer: https://testnet.arcscan.app/address/${contractAddress}`);
    } else if (error.message.includes("does not have bytecode")) {
      console.error("\n❌ ERROR: Contract not found at this address");
      console.error("   Check that ESCROW_CONTRACT_ADDRESS is correct");
      console.error("   Make sure contract was deployed to arcTestnet");
    } else if (error.message.includes("constructor arguments")) {
      console.error("\n❌ ERROR: Constructor arguments mismatch");
      console.error("   Verify ORACLE_ADDRESS matches the address used during deployment");
    } else {
      console.error("\n❌ Verification failed:");
      console.error(`   ${error.message}`);
      console.error("\n💡 Try manual verification:");
      console.error(`   1. Go to https://testnet.arcscan.app/address/${contractAddress}`);
      console.error("   2. Click 'Contract' tab");
      console.error("   3. Click 'Verify and Publish'");
      console.error("   4. Upload contract source code");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
