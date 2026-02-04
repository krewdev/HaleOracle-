const anchor = require("@coral-xyz/anchor");
const { expect } = require("chai");
const crypto = require("crypto");

describe("hale-solana", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.haleSolana;

  it("Initializes and seals an attestation", async () => {
    const authority = provider.wallet.publicKey;
    const intentHash = crypto.randomBytes(32);
    const metadataUri = "https://hale.secure/intent-logs/123";

    const [attestationAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("attestation"), authority.toBuffer(), intentHash],
      program.programId
    );

    // 1. Initialize
    await program.methods
      .initializeAttestation(Array.from(intentHash), metadataUri)
      .accounts({
        attestation: attestationAddress,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const rawAccount = await provider.connection.getAccountInfo(attestationAddress);
    console.log("Raw account data length:", rawAccount.data.length);
    console.log("Raw account data (hex):", rawAccount.data.toString("hex"));

    let account = await program.account.attestation.fetch(attestationAddress);
    expect(account.authority.toString()).to.equal(authority.toString());
    expect(Buffer.from(account.intentHash)).to.deep.equal(intentHash);
    expect(account.metadataUri).to.equal(metadataUri);
    expect(account.status.draft).to.not.be.undefined;

    // 2. Seal
    const outcomeHash = crypto.randomBytes(32);
    await program.methods
      .sealAttestation(Array.from(outcomeHash))
      .accounts({
        attestation: attestationAddress,
        authority: authority,
      })
      .rpc();

    account = await program.account.attestation.fetch(attestationAddress);
    expect(account.status.sealed).to.not.be.undefined;
    expect(Buffer.from(account.outcomeHash)).to.deep.equal(outcomeHash);
  });
});
