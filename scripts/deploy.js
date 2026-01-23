const hre = require("hardhat");

async function main() {
  const HALE_ORACLE_ADDRESS = process.env.HALE_ORACLE_ADDRESS;
  
  if (!HALE_ORACLE_ADDRESS) {
    throw new Error("HALE_ORACLE_ADDRESS environment variable not set");
  }

  console.log("Deploying ArcFuseEscrow contract...");
  console.log("HALE Oracle address:", HALE_ORACLE_ADDRESS);
  console.log("Network:", hre.network.name);

  // Get signers
  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Check PRIVATE_KEY or ORACLE_PRIVATE_KEY in .env");
  }
  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "USDC");

  const ArcFuseEscrow = await hre.ethers.getContractFactory("ArcFuseEscrow");
  const escrow = await ArcFuseEscrow.deploy(HALE_ORACLE_ADDRESS);

  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  
  console.log("\n✅ ArcFuseEscrow contract deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Oracle address:", HALE_ORACLE_ADDRESS);
  console.log("\n📝 Next steps:");
  console.log("1. Add this to your .env file:");
  console.log(`   ESCROW_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Export contract ABI:");
  console.log("   cat artifacts/contracts/ArcFuseEscrow.sol/ArcFuseEscrow.json | jq .abi > escrow_abi.json");
  console.log("3. Verify contract on block explorer (optional):");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress} ${HALE_ORACLE_ADDRESS}`);
  console.log("4. Check contract state:");
  console.log(`   npx hardhat run scripts/checkContract.js --network ${hre.network.name}`);
  console.log("5. Update hale_oracle_backend.py with contract address");

  // Verify contract info
  const oracleAddress = await escrow.oracle();
  const ownerAddress = await escrow.owner();
  const contractBalance = await hre.ethers.provider.getBalance(contractAddress);
  
  console.log("\nContract Info:");
  console.log("- Oracle:", oracleAddress);
  console.log("- Owner:", ownerAddress);
  console.log("- Balance:", hre.ethers.formatEther(contractBalance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
