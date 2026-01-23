const hre = require("hardhat");
require("dotenv").config();

/**
 * Script to check the state of a deployed ArcFuseEscrow contract
 * Usage: npx hardhat run scripts/checkContract.js --network <network>
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS;
  
  if (!CONTRACT_ADDRESS) {
    throw new Error("ESCROW_CONTRACT_ADDRESS not set in .env file");
  }

  console.log("Checking ArcFuseEscrow contract...");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("");

  const ArcFuseEscrow = await hre.ethers.getContractFactory("ArcFuseEscrow");
  const escrow = ArcFuseEscrow.attach(CONTRACT_ADDRESS);

  // Get contract info
  const oracle = await escrow.oracle();
  const owner = await escrow.owner();
  const contractBalance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);
  const maxDepositors = await escrow.MAX_DEPOSITORS();

  console.log("📋 Contract Information:");
  console.log("   Oracle Address:", oracle);
  console.log("   Owner Address:", owner);
  console.log("   Contract Balance:", hre.ethers.formatEther(contractBalance), "ETH");
  console.log("   Max Depositors:", maxDepositors.toString());
  console.log("");

  // Check if contract is deployed correctly
  try {
    const code = await hre.ethers.provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      console.log("❌ Error: No contract found at this address!");
      return;
    }
    console.log("✅ Contract code found at address");
  } catch (error) {
    console.log("❌ Error checking contract:", error.message);
    return;
  }

  // Verify oracle address matches
  const expectedOracle = process.env.HALE_ORACLE_ADDRESS;
  if (expectedOracle && oracle.toLowerCase() !== expectedOracle.toLowerCase()) {
    console.log("⚠️  Warning: Oracle address mismatch!");
    console.log("   Expected:", expectedOracle);
    console.log("   Actual:", oracle);
  } else {
    console.log("✅ Oracle address matches configuration");
  }

  console.log("");
  console.log("💡 To check specific seller deposits:");
  console.log("   Use: escrow.deposits(sellerAddress)");
  console.log("   Use: escrow.getDepositors(sellerAddress)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
