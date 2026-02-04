import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import * as fs from "fs";
import idl from "./idl.json" with { type: "json" };
import crypto from "crypto";

// Minimal HaleClient for the demo
class HaleClient {
    public program: anchor.Program<any>;
    constructor(connection: Connection, wallet: any) {
        const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
        this.program = new anchor.Program(idl as any, provider);
    }
    public async getAttestationAddress(authority: PublicKey, intentHash: Buffer): Promise<PublicKey> {
        const [address] = PublicKey.findProgramAddressSync(
            [Buffer.from("attestation"), authority.toBuffer(), intentHash],
            this.program.programId
        );
        return address;
    }
    public async initializeAttestation(intentHash: Buffer, metadataUri: string) {
        const authority = (this.program.provider as anchor.AnchorProvider).wallet.publicKey;
        const attestation = await this.getAttestationAddress(authority, intentHash);
        return await this.program.methods
            .initializeAttestation(Array.from(intentHash), metadataUri)
            .accounts({ attestation, authority, systemProgram: anchor.web3.SystemProgram.programId } as any)
            .rpc();
    }
    public async sealAttestation(intentHash: Buffer, outcomeHash: Buffer) {
        const authority = (this.program.provider as anchor.AnchorProvider).wallet.publicKey;
        const attestation = await this.getAttestationAddress(authority, intentHash);
        return await this.program.methods
            .sealAttestation(Array.from(outcomeHash))
            .accounts({ attestation, authority } as any)
            .rpc();
    }
}

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const secretKey = JSON.parse(fs.readFileSync("/Users/krewdev/.config/solana/id.json", "utf8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    const wallet = new anchor.Wallet(keypair);
    const client = new HaleClient(connection, wallet);

    console.log("=== HALE Agentic Swap Demo (Jupiter Integration Simulation) ===");

    // 1. Define Intent
    const swapAmount = 1_000_000_000; // 1 SOL
    const intent = {
        action: "swap",
        inputMint: "So11111111111111111111111111111111111111112",
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: swapAmount,
        minOutput: 150_000_000, // 150 USDC
        reason: "Momentum indicator RSI < 30 on SOL/USDC technical analysis."
    };

    const intentPayload = JSON.stringify(intent);
    const intentHash = crypto.createHash('sha256').update(intentPayload).digest();

    // 2. Publish Intent On-Chain
    console.log("Recording Intent to HALE...");
    const metadataUri = "https://hale.storage/reports/" + intentHash.toString('hex');
    const initTx = await client.initializeAttestation(intentHash, metadataUri);
    console.log("Intent Recorded! TX:", initTx);

    // 3. Simulate Swap (Jupiter)
    console.log("Executing Swap on Jupiter Simulation...");
    await new Promise(r => setTimeout(r, 2000)); // Mock delay

    const actualOutput = 152_450_000; // 152.45 USDC
    const result = {
        status: "success",
        outputAmount: actualOutput,
        txSignature: "5abc...xyz"
    };

    // 4. Seal Attestation with Outcome
    console.log("Sealing Attestation with Outcome...");
    const outcomePayload = JSON.stringify(result);
    const outcomeHash = crypto.createHash('sha256').update(outcomePayload).digest();
    const sealTx = await client.sealAttestation(intentHash, outcomeHash);
    console.log("Attestation Sealed! TX:", sealTx);

    console.log("\nForensic Trail Complete.");
    console.log(`Auditors can now verify the intent [${intentHash.toString('hex').slice(0, 8)}...] against the execution resut.`);
}

main().catch(console.error);
