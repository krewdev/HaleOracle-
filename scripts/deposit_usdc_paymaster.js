// Deposit USDC to paymaster
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const paymasterAddress = process.env.PAYMASTER_ADDRESS;
  
  // Get USDC address (check network-specific first)
  const network = hre.network.name;
  let usdcAddress = process.env.USDC_TOKEN_ADDRESS;
  
  if (network === 'sepolia' || network === 'hardhat') {
    usdcAddress = process.env.USDC_TOKEN_ADDRESS_SEPOLIA || 
                  process.env.USDC_TOKEN_ADDRESS ||
                  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  } else if (network === 'arcTestnet' || network === 'arc') {
    usdcAddress = process.env.USDC_TOKEN_ADDRESS ||
                  '0x3600000000000000000000000000000000000000';
  }
  const depositAmount = process.env.USDC_DEPOSIT_AMOUNT || "100"; // Default 100 USDC (6 decimals)
  
  if (!paymasterAddress) {
    console.error("ERROR: PAYMASTER_ADDRESS not set in .env");
    process.exit(1);
  }
  
  if (!usdcAddress) {
    console.error("ERROR: USDC_TOKEN_ADDRESS not set in .env");
    process.exit(1);
  }
  
  const [signer] = await hre.ethers.getSigners();
  
  // USDC has 6 decimals
  const amount = hre.ethers.parseUnits(depositAmount, 6);
  
  console.log(`💰 Depositing USDC to paymaster...\n`);
  console.log(`Paymaster: ${paymasterAddress}`);
  console.log(`USDC Token: ${usdcAddress}`);
  console.log(`Depositor: ${signer.address}`);
  console.log(`Amount: ${depositAmount} USDC\n`);
  
  // Load USDC token contract
  const usdcAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ];
  
  const usdc = new hre.ethers.Contract(usdcAddress, usdcAbi, signer);
  
  // Check balance
  const balance = await usdc.balanceOf(signer.address);
  if (balance < amount) {
    console.error(`ERROR: Insufficient USDC balance`);
    console.error(`   Required: ${depositAmount} USDC`);
    console.error(`   Available: ${hre.ethers.formatUnits(balance, 6)} USDC`);
    process.exit(1);
  }
  
  // Check allowance
  const allowance = await usdc.allowance(signer.address, paymasterAddress);
  if (allowance < amount) {
    console.log(`Approving USDC spending...`);
    const approveTx = await usdc.approve(paymasterAddress, amount);
    await approveTx.wait();
    console.log(`✅ Approval confirmed\n`);
  }
  
  // Deposit to paymaster
  const USDCPaymaster = await hre.ethers.getContractFactory("USDCPaymaster");
  const paymaster = USDCPaymaster.attach(paymasterAddress);
  
  const tx = await paymaster.depositUSDC(amount);
  console.log(`Transaction submitted: ${tx.hash}`);
  
  await tx.wait();
  console.log(`✅ USDC deposit successful!`);
  
  // Check balances
  const paymasterUSDC = await paymaster.totalUSDCBalance();
  const sponsorUSDC = await paymaster.getSponsorUSDCBalance(signer.address);
  
  console.log(`\n📊 Paymaster Status:`);
  console.log(`   Total USDC balance: ${hre.ethers.formatUnits(paymasterUSDC, 6)} USDC`);
  console.log(`   Your USDC balance: ${hre.ethers.formatUnits(sponsorUSDC, 6)} USDC`);
  
  const info = await paymaster.getPaymasterInfo();
  console.log(`   Gas price: ${info.gasPrice} (0.000001 USDC per gas unit)`);
  console.log(`   Max gas per tx: ${info.maxGas}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
