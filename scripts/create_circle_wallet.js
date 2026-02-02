require('dotenv').config();
const { initiateDeveloperControlledWalletsClient } = require("@circle-fin/developer-controlled-wallets");

async function createWallet() {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
        console.error("❌ Error: API Key or Entity Secret missing in .env");
        process.exit(1);
    }

    const client = initiateDeveloperControlledWalletsClient({
        apiKey: apiKey,
        entitySecret: entitySecret
    });

    try {
        console.log("🔄 Creating Wallet Set...");
        const walletSetResponse = await client.createWalletSet({
            name: "HALE Oracle Wallet Set"
        });

        const walletSet = walletSetResponse.data?.walletSet;
        if (!walletSet) {
            throw new Error("Failed to create wallet set");
        }
        console.log(`✅ Wallet Set Created: ${walletSet.id}`);

        console.log("🔄 Creating Wallet...");
        // Create 1 wallet in the set with default config
        const walletsResponse = await client.createWallets({
            accountType: "SCA", // Smart Contract Account (standard for devs)
            blockchains: ["ETH-SEPOLIA"], // Initialize with Sepolia, usually supports EVM
            count: 1,
            walletSetId: walletSet.id
        });

        const wallets = walletsResponse.data?.wallets;
        if (!wallets || wallets.length === 0) {
            throw new Error("Failed to create wallets");
        }

        const wallet = wallets[0];
        console.log("\n✅ Wallet Created Successfully!");
        console.log(`ID: ${wallet.id}`);
        console.log(`Access Type: ${wallet.accountType}`);
        console.log(`Blockchain: ${wallet.blockchain}`);
        console.log(`Address: ${wallet.address}`); // Initial address

        console.log("\n⚠️  ACTION REQUIRED: Update your .env file with this Wallet ID:");
        console.log(`CIRCLE_WALLET_ID=${wallet.id}`);

    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
    }
}

createWallet();
