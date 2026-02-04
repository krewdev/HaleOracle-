import * as anchor from "@coral-xyz/anchor";
const { Program } = anchor;
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Buffer } from "buffer";
import idl from "./idl.json" with { type: "json" };

export class HaleClient {
    public program: anchor.Program<any>;

    constructor(
        connection: Connection,
        wallet: any,
        programId?: string
    ) {
        const provider = new anchor.AnchorProvider(connection, wallet, {
            preflightCommitment: "processed",
        });

        let actualIdl = idl as any;
        if (programId) {
            actualIdl.address = programId;
        }

        this.program = new Program(actualIdl, provider);
    }

    public async getAttestationAddress(authority: PublicKey, intentHash: Buffer | Uint8Array): Promise<PublicKey> {
        const hashBuffer = Buffer.from(intentHash);
        const [address] = PublicKey.findProgramAddressSync(
            [Buffer.from("attestation"), authority.toBuffer(), hashBuffer],
            this.program.programId
        );
        return address;
    }

    public async initializeAttestation(
        intentHash: Buffer | Uint8Array,
        metadataUri: string
    ): Promise<string> {
        const hashArray = Array.from(intentHash);
        const authority = (this.program.provider as anchor.AnchorProvider).wallet.publicKey;
        const attestation = await this.getAttestationAddress(authority, intentHash);

        return await this.program.methods
            .initializeAttestation(hashArray, metadataUri)
            .accounts({
                attestation,
                authority,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
    }

    public async sealAttestation(
        intentHash: Buffer | Uint8Array,
        outcomeHash: Buffer | Uint8Array
    ): Promise<string> {
        const outcomeArray = Array.from(outcomeHash);
        const authority = (this.program.provider as anchor.AnchorProvider).wallet.publicKey;
        const attestation = await this.getAttestationAddress(authority, intentHash);

        return await this.program.methods
            .sealAttestation(outcomeArray)
            .accounts({
                attestation,
                authority,
            } as any)
            .rpc();
    }

    public async auditAttestation(
        authority: PublicKey,
        intentHash: Buffer | Uint8Array,
        reportHash: Buffer | Uint8Array,
        isValid: boolean
    ): Promise<string> {
        const reportArray = Array.from(reportHash);
        const auditor = (this.program.provider as anchor.AnchorProvider).wallet.publicKey;
        const attestation = await this.getAttestationAddress(authority, intentHash);

        return await this.program.methods
            .auditAttestation(reportArray, isValid)
            .accounts({
                attestation,
                auditor,
            } as any)
            .rpc();
    }

    public async challengeAttestation(
        authority: PublicKey,
        intentHash: Buffer | Uint8Array,
        evidenceUri: string
    ): Promise<string> {
        const challenger = (this.program.provider as anchor.AnchorProvider).wallet.publicKey;
        const attestation = await this.getAttestationAddress(authority, intentHash);

        return await this.program.methods
            .challengeAttestation(evidenceUri)
            .accounts({
                attestation,
                challenger,
            } as any)
            .rpc();
    }

    public async fetchAttestation(address: PublicKey) {
        return await (this.program.account as any).attestation.fetch(address);
    }
}
