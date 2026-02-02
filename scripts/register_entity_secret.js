require('dotenv').config();
const { registerEntitySecretCiphertext } = require("@circle-fin/developer-controlled-wallets");
const fs = require('fs');

async function register() {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || apiKey.includes('your-key-id')) {
        console.error("❌ Error: CIRCLE_API_KEY is not set correctly in .env");
        process.exit(1);
    }

    if (!entitySecret) {
        console.error("❌ Error: CIRCLE_ENTITY_SECRET is not set in .env");
        process.exit(1);
    }

    console.log("🔄 Registering entity secret...");

    try {
        const response = await registerEntitySecretCiphertext({
            apiKey: apiKey,
            entitySecret: entitySecret
        });

        console.log("✅ Registration successful!");

        if (response.data?.recoveryFile) {
            fs.writeFileSync('recovery_file.dat', response.data.recoveryFile);
            console.log("📄 Recovery file saved to: recovery_file.dat");
            console.log("⚠️  Keep this file safe!");
        }
    } catch (error) {
        console.error("❌ Registration failed:", error);
    }
}

register();
