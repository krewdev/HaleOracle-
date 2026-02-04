const anchor = require("@coral-xyz/anchor");
const { expect } = require("chai");
const crypto = require("crypto");

describe("hale-escrow", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const escrowProgram = anchor.workspace.haleEscrow;

    it("Full Escrow Lifecycle: Create -> Deposit -> Release", async () => {
        const buyer = provider.wallet.publicKey;
        const seller = anchor.web3.Keypair.generate().publicKey;
        const intentHash = crypto.randomBytes(32);
        const amount = new anchor.BN(1000000); // 1M lamports

        const [escrowAddress] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("escrow"), buyer.toBuffer(), intentHash],
            escrowProgram.programId
        );

        // 1. Create Escrow
        await escrowProgram.methods
            .createEscrow(Array.from(intentHash), amount, false) // false = is_spl
            .accounts({
                escrow: escrowAddress,
                buyer: buyer,
                seller: seller,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        let account = await escrowProgram.account.escrowAccount.fetch(escrowAddress);
        expect(account.buyer.toString()).to.equal(buyer.toString());
        expect(account.status.draft).to.not.be.undefined;

        // 2. Deposit
        await escrowProgram.methods
            .depositSol()
            .accounts({
                escrow: escrowAddress,
                buyer: buyer,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        account = await escrowProgram.account.escrowAccount.fetch(escrowAddress);
        expect(account.status.funded).to.not.be.undefined;

        // 3. Release (Oracle/Authority)
        await escrowProgram.methods
            .release()
            .accounts({
                escrow: escrowAddress,
                oracle: buyer, // For now, we use current wallet as oracle
                seller: seller,
                sellerTokenAccount: null,
                escrowTokenVault: null,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            })
            .rpc();

        account = await escrowProgram.account.escrowAccount.fetch(escrowAddress);
        expect(account.status.released).to.not.be.undefined;
    });
});
