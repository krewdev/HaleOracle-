// Deposit funds to paymaster
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const paymasterAddress = process.env.PAYMASTER_ADDRESS;
  const depositAmount = process.env.PAYMASTER_DEPOSIT_AMOUNT || "0.1"; // Default 0.1 ETH
  
  if (!paymasterAddress) {
    console.error("ERROR: PAYMASTER_ADDRESS not set in .env");
    process.exit(1);
  }
  
  const [signer] = await hre.ethers.getSigners();
  const amount = hre.ethers.parseEther(depositAmount);
  
  console.log(`💰 Depositing to paymaster...\n`);
  console.log(`Paymaster: ${paymasterAddress}`);
  console.log(`Depositor: ${signer.address}`);
  console.log(`Amount: ${depositAmount} ETH\n`);
  
  const Paymaster = await hre.ethers.getContractFactory("Paymaster");
  const paymaster = Paymaster.attach(paymasterAddress);
  
  const tx = await paymaster.deposit({ value: amount });
  console.log(`Transaction submitted: ${tx.hash}`);
  
  await tx.wait();
  console.log(`✅ Deposit successful!`);
  
  // Check balance
  const balance = await paymaster.totalBalance();
  const sponsorBalance = await paymaster.getSponsorBalance(signer.address);
  
  console.log(`\n📊 Paymaster Status:`);
  console.log(`   Total balance: ${hre.ethers.formatEther(balance)} ETH`);
  console.log(`   Your balance: ${hre.ethers.formatEther(sponsorBalance)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
