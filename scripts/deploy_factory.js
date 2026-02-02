const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance));

    const oracleAddress = deployer.address; // Use deployer as oracle for now
    console.log("Oracle address:", oracleAddress);

    const Factory = await hre.ethers.getContractFactory("ArcFuseEscrowFactory");
    const factory = await Factory.deploy(oracleAddress);
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    console.log("Factory deployed to:", factoryAddress);

    // Test by creating an escrow
    console.log("\nCreating test escrow...");
    const tx = await factory.createEscrow();
    const receipt = await tx.wait();

    // Get escrow address from event
    const event = receipt.logs.find(log => {
        try {
            return factory.interface.parseLog(log)?.name === "EscrowCreated";
        } catch {
            return false;
        }
    });

    if (event) {
        const parsed = factory.interface.parseLog(event);
        const escrowAddress = parsed.args[0];
        console.log("Test escrow created at:", escrowAddress);

        // Verify the escrow has setContractRequirements
        const escrowCode = await hre.ethers.provider.getCode(escrowAddress);
        const hasSelector = escrowCode.toLowerCase().includes("2eb33e2b");
        console.log("Has setContractRequirements (2eb33e2b):", hasSelector);
        const hasIsDepositor = escrowCode.toLowerCase().includes("b74313dd");
        console.log("Has isExistingDepositor (b74313dd):", hasIsDepositor);
    }

    console.log("\n=== Copy these values ===");
    console.log(`FACTORY_CONTRACT_ADDRESS=${factoryAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
