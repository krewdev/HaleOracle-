// Check escrow balance and status
const { ethers } = require("ethers");
require("dotenv").config();

async function checkEscrow() {
  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL);
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  
  if (!escrowAddress) {
    console.error("ERROR: ESCROW_CONTRACT_ADDRESS not set in .env");
    process.exit(1);
  }
  
  const escrowABI = require("../escrow_abi.json");
  const escrow = new ethers.Contract(escrowAddress, escrowABI, provider);
  
  const sellerAddress = process.env.SELLER_ADDRESS;
  if (!sellerAddress) {
    console.error("ERROR: SELLER_ADDRESS not set in .env");
    process.exit(1);
  }
  
  console.log(`\n📊 Escrow Status`);
  console.log(`Contract: ${escrowAddress}`);
  console.log(`Seller: ${sellerAddress}`);
  console.log(`View on explorer: https://testnet.arcscan.app/address/${escrowAddress}`);
  
  try {
    // Get contract info
    const oracle = await escrow.oracle();
    const owner = await escrow.owner();
    const maxDepositors = await escrow.MAX_DEPOSITORS();
    
    console.log(`\n📋 Contract Info:`);
    console.log(`  Oracle: ${oracle}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  Max Depositors: ${maxDepositors}`);
    
    // Get seller balance
    const balance = await escrow.deposits(sellerAddress);
    const depositorCount = await escrow.getDepositorCount(sellerAddress);
    
    console.log(`\n💰 Escrow Balance:`);
    console.log(`  Amount: ${ethers.formatEther(balance)} ETH`);
    console.log(`  Depositors: ${depositorCount}`);
    
    if (depositorCount > 0) {
      const depositors = await escrow.getDepositors(sellerAddress);
      console.log(`\n👥 Depositor Details:`);
      depositors.forEach((dep, i) => {
        console.log(`  ${i + 1}. ${dep.depositor}`);
        console.log(`     Amount: ${ethers.formatEther(dep.amount)} ETH`);
      });
    } else {
      console.log(`\n⚠️  No deposits found for this seller`);
    }
    
    // Check if transaction was released
    const txId = process.env.TRANSACTION_ID;
    if (txId) {
      const isReleased = await escrow.releasedTransactions(txId);
      console.log(`\n🔐 Transaction Status:`);
      console.log(`  Transaction ID: ${txId}`);
      console.log(`  Released: ${isReleased ? 'Yes' : 'No'}`);
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

checkEscrow().catch(console.error);
