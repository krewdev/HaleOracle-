import { Connection, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { HaleClient } from "./index.js";
import { Buffer } from "buffer";
import * as fs from "fs";

async function main() {
    const connection = new Connection("http://127.0.0.1:8899", "processed");

    // Load local keypair
    const secretKey = JSON.parse(fs.readFileSync("/Users/krewdev/.config/solana/id.json", "utf8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    const wallet = new anchor.Wallet(keypair);

    const client = new HaleClient(connection, wallet);

    console.log("Authority:", keypair.publicKey.toBase58());

    const intentHash = Buffer.from(anchor.web3.Keypair.generate().publicKey.toBytes()); // Use random bytes
    const metadataUri = "https://hale.secure/demo/1";

    console.log("Initializing attestation...");
    const initTx = await client.initializeAttestation(intentHash, metadataUri);
    console.log("Init TX:", initTx);

    const address = await client.getAttestationAddress(keypair.publicKey, intentHash);
    console.log("Attestation Address:", address.toBase58());

    const account = await client.fetchAttestation(address);
    console.log("Account Data:", JSON.stringify(account, null, 2));

    console.log("Sealing attestation...");
    const outcomeHash = Buffer.from(new Uint8Array(32).fill(2)); // Dummy result
    const sealTx = await client.sealAttestation(intentHash, outcomeHash);
    console.log("Seal TX:", sealTx);

    const updatedAccount = await client.fetchAttestation(address);
    console.log("Updated Account Status:", Object.keys(updatedAccount.status)[0]);

    console.log("Challenging attestation...");
    const challengeTx = await client.challengeAttestation(keypair.publicKey, intentHash, "https://hale.evidence/suspect-activity");
    console.log("Challenge TX:", challengeTx);

    const challengedAccount = await client.fetchAttestation(address);
    console.log("Final Account Status:", Object.keys(challengedAccount.status)[0]);
}

main().catch(console.error);
