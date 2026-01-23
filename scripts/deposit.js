// Deposit funds into escrow
const { ethers } = require("ethers");
require("dotenv").config();

async function deposit() {
  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BUYER_PRIVATE_KEY, provider);
  
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  if (!escrowAddress) {
    console.error("ERROR: ESCROW_CONTRACT_ADDRESS not set in .env");
    process.exit(1);
  }
  
  const escrowABI = require("../escrow_abi.json");
  const escrow = new ethers.Contract(escrowAddress, escrowABI, wallet);
  
  const sellerAddress = process.env.SELLER_ADDRESS;
  if (!sellerAddress) {
    console.error("ERROR: SELLER_ADDRESS not set in .env");
    process.exit(1);
  }
  
  const amount = process.env.DEPOSIT_AMOUNT || "0.01"; // Default 0.01 ETH
  const amountWei = ethers.parseEther(amount);
  
  console.log(`\n💰 Depositing ${amount} ETH for seller ${sellerAddress}...`);
  console.log(`Contract: ${escrowAddress}`);
  console.log(`Buyer: ${wallet.address}`);
  
  try {
    const tx = await escrow.deposit(sellerAddress, { value: amountWei });
    console.log(`\n📤 Transaction submitted: ${tx.hash}`);
    console.log(`View on explorer: https://testnet.arcscan.app/tx/${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`\n✅ Deposit confirmed in block ${receipt.blockNumber}`);
    
    // Check balance
    const balance = await escrow.deposits(sellerAddress);
    console.log(`\n📊 Escrow balance: ${ethers.formatEther(balance)} ETH`);
    
    // Check depositors
    const depositorCount = await escrow.getDepositorCount(sellerAddress);
    console.log(`📊 Depositor count: ${depositorCount}`);
    
    if (depositorCount > 0) {
      const depositors = await escrow.getDepositors(sellerAddress);
      console.log(`\nDepositors:`);
      depositors.forEach((dep, i) => {
        console.log(`  ${i + 1}. ${dep.depositor}: ${ethers.formatEther(dep.amount)} ETH`);
      });
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    process.exit(1);
  }
}

deposit().catch(console.error);
