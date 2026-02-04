import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import * as fs from "fs";
import idl from "./idl.json" with { type: "json" };
import Irys from "@irys/sdk";

async function main() {
    const connection = new Connection("http://127.0.0.1:8899", "processed");

    // Identity
    const secretKeyPath = "/Users/krewdev/.config/solana/id.json";
    const secretKey = JSON.parse(fs.readFileSync(secretKeyPath, "utf8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

    // Mock Irys setup (in reality needs funded devnet/mainnet node)
    console.log("HALE Auditor started:", keypair.publicKey.toBase58());

    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), {
        preflightCommitment: "processed",
    });
    const program = new anchor.Program(idl as any, provider);

    const accounts = await (program.account as any).attestation.all();
    console.log(`Auditing ${accounts.length} accounts...`);

    for (const { publicKey, account } of accounts) {
        const currentStatus = Object.keys(account.status)[0];

        if (currentStatus === "sealed") {
            // ... same logic
            console.log(`\nVerifying Attestation: ${publicKey.toBase58()}`);
            console.log("Submitting VALID verdict...");
            const mockReportHash = Buffer.from(new Uint8Array(32).fill(10));
            await program.methods.auditAttestation(Array.from(mockReportHash), true).accounts({ attestation: publicKey, auditor: keypair.publicKey } as any).rpc();
        } else if (currentStatus === "disputed") {
            console.log(`\nREVIEWING CHALLENGE: ${publicKey.toBase58()}`);
            console.log(`Evidence: ${account.evidenceUri}`);
            console.log("Auditor has reviewed evidence. Finalizing resolution...");
            const mockReportHash = Buffer.from(new Uint8Array(32).fill(11));
            // Finalize by overwriting with an Audit (either true or false)
            await program.methods.auditAttestation(Array.from(mockReportHash), false).accounts({ attestation: publicKey, auditor: keypair.publicKey } as any).rpc();
            console.log(`Resolution complete for ${publicKey.toBase58()}`);
        }
    }
}

main().catch(console.error);
