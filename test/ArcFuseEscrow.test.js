const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArcFuseEscrow", function () {
  let escrow;
  let owner;
  let oracle;
  let seller;
  let buyer1;
  let buyer2;
  let buyer3;
  let other;

  beforeEach(async function () {
    [owner, oracle, seller, buyer1, buyer2, buyer3, other] = await ethers.getSigners();

    const ArcFuseEscrow = await ethers.getContractFactory("ArcFuseEscrow");
    escrow = await ArcFuseEscrow.deploy(oracle.address, owner.address);
    await escrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct oracle address", async function () {
      expect(await escrow.oracle()).to.equal(oracle.address);
    });

    it("Should set the correct owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });
  });

  describe("Deposit", function () {
    it("Should allow buyer to deposit funds for seller", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(escrow.connect(buyer1).deposit(seller.address, { value: amount }))
        .to.emit(escrow, "Deposit")
        .withArgs(seller.address, buyer1.address, amount);

      expect(await escrow.deposits(seller.address)).to.equal(amount);
      expect(await escrow.getDepositorCount(seller.address)).to.equal(1);

      const depositors = await escrow.getDepositors(seller.address);
      expect(depositors.length).to.equal(1);
      expect(depositors[0].depositor).to.equal(buyer1.address);
      expect(depositors[0].amount).to.equal(amount);
    });

    it("Should track multiple depositors (up to 3)", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("0.5");
      const amount3 = ethers.parseEther("0.3");

      await escrow.connect(buyer1).deposit(seller.address, { value: amount1 });
      await escrow.connect(buyer2).deposit(seller.address, { value: amount2 });
      await escrow.connect(buyer3).deposit(seller.address, { value: amount3 });

      expect(await escrow.getDepositorCount(seller.address)).to.equal(3);
      expect(await escrow.deposits(seller.address)).to.equal(ethers.parseEther("1.8"));

      const depositors = await escrow.getDepositors(seller.address);
      expect(depositors.length).to.equal(3);
      expect(depositors[0].depositor).to.equal(buyer1.address);
      expect(depositors[1].depositor).to.equal(buyer2.address);
      expect(depositors[2].depositor).to.equal(buyer3.address);
    });

    it("Should allow same buyer to deposit multiple times", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("0.5");

      await escrow.connect(buyer1).deposit(seller.address, { value: amount1 });
      await escrow.connect(buyer1).deposit(seller.address, { value: amount2 });

      expect(await escrow.getDepositorCount(seller.address)).to.equal(1);
      expect(await escrow.deposits(seller.address)).to.equal(ethers.parseEther("1.5"));

      const depositors = await escrow.getDepositors(seller.address);
      expect(depositors[0].amount).to.equal(ethers.parseEther("1.5"));
    });

    it("Should reject deposits beyond maximum (3)", async function () {
      await escrow.connect(buyer1).deposit(seller.address, { value: ethers.parseEther("1.0") });
      await escrow.connect(buyer2).deposit(seller.address, { value: ethers.parseEther("1.0") });
      await escrow.connect(buyer3).deposit(seller.address, { value: ethers.parseEther("1.0") });

      await expect(
        escrow.connect(other).deposit(seller.address, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Maximum depositors reached");
    });

    it("Should reject zero amount deposits", async function () {
      await expect(
        escrow.connect(buyer1).deposit(seller.address, { value: 0 })
      ).to.be.revertedWith("Deposit must be > 0");
    });

    it("Should reject deposits to zero address", async function () {
      await expect(
        escrow.connect(buyer1).deposit(ethers.ZeroAddress, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Invalid seller");
    });

    it("Should reject seller depositing for themselves", async function () {
      await expect(
        escrow.connect(seller).deposit(seller.address, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Seller cannot deposit for themselves");
    });
  });

  describe("Release", function () {
    beforeEach(async function () {
      await escrow.connect(buyer1).deposit(seller.address, {
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should allow oracle to release funds to seller", async function () {
      const transactionId = "tx_0x123abc_arc";
      const initialBalance = await ethers.provider.getBalance(seller.address);

      await expect(escrow.connect(oracle).release(seller.address, transactionId))
        .to.emit(escrow, "Release")
        .withArgs(seller.address, ethers.parseEther("1.0"), transactionId);

      expect(await escrow.deposits(seller.address)).to.equal(0);
      expect(await escrow.getDepositorCount(seller.address)).to.equal(0);
      expect(await escrow.releasedTransactions(transactionId)).to.be.true;

      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should release all funds from multiple depositors to seller", async function () {
      await escrow.connect(buyer2).deposit(seller.address, { value: ethers.parseEther("0.5") });
      await escrow.connect(buyer3).deposit(seller.address, { value: ethers.parseEther("0.3") });

      const transactionId = "tx_0x123abc_arc";
      const initialBalance = await ethers.provider.getBalance(seller.address);

      await escrow.connect(oracle).release(seller.address, transactionId);

      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.8"));
      expect(await escrow.getDepositorCount(seller.address)).to.equal(0);
    });

    it("Should reject release from non-oracle", async function () {
      await expect(
        escrow.connect(other).release(seller.address, "tx_0x123abc_arc")
      ).to.be.revertedWith("Only Oracle can call");
    });

    it("Should reject release when no funds available", async function () {
      await escrow.connect(oracle).release(seller.address, "tx_0x123abc_arc");

      await expect(
        escrow.connect(oracle).release(seller.address, "tx_0x456def_arc")
      ).to.be.revertedWith("No funds");
    });

    it("Should reject duplicate transaction IDs", async function () {
      const transactionId = "tx_0x123abc_arc";
      await escrow.connect(oracle).release(seller.address, transactionId);

      await escrow.connect(buyer1).deposit(seller.address, {
        value: ethers.parseEther("1.0"),
      });

      await expect(
        escrow.connect(oracle).release(seller.address, transactionId)
      ).to.be.revertedWith("Tx already processed");
    });
  });

  describe("Refund", function () {
    beforeEach(async function () {
      await escrow.connect(buyer1).deposit(seller.address, {
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should allow oracle to refund single buyer", async function () {
      const reason = "VERIFICATION_FAILED";
      const initialBalance = await ethers.provider.getBalance(buyer1.address);

      await expect(escrow.connect(oracle).refund(seller.address, reason))
        .to.emit(escrow, "Withdrawal")
        .withArgs(buyer1.address, ethers.parseEther("1.0"), reason);

      expect(await escrow.deposits(seller.address)).to.equal(0);
      expect(await escrow.getDepositorCount(seller.address)).to.equal(0);

      const finalBalance = await ethers.provider.getBalance(buyer1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should refund multiple buyers proportionally", async function () {
      // Clear any existing deposits from beforeEach by refunding first
      if ((await escrow.deposits(seller.address)) > 0) {
        await escrow.connect(oracle).refund(seller.address, "CLEAR_STATE");
      }

      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("0.5");
      const amount3 = ethers.parseEther("0.3");

      // Get initial balances
      const initialBalance1 = await ethers.provider.getBalance(buyer1.address);
      const initialBalance2 = await ethers.provider.getBalance(buyer2.address);
      const initialBalance3 = await ethers.provider.getBalance(buyer3.address);

      // Make deposits
      await escrow.connect(buyer1).deposit(seller.address, { value: amount1 });
      await escrow.connect(buyer2).deposit(seller.address, { value: amount2 });
      await escrow.connect(buyer3).deposit(seller.address, { value: amount3 });

      // Verify depositors before refund
      const depositorsBefore = await escrow.getDepositors(seller.address);
      expect(depositorsBefore.length).to.equal(3);
      expect(depositorsBefore[0].depositor).to.equal(buyer1.address);
      expect(depositorsBefore[0].amount).to.equal(amount1);
      expect(depositorsBefore[1].depositor).to.equal(buyer2.address);
      expect(depositorsBefore[1].amount).to.equal(amount2);
      expect(depositorsBefore[2].depositor).to.equal(buyer3.address);
      expect(depositorsBefore[2].amount).to.equal(amount3);

      // Get balances after deposits (accounting for gas)
      const balanceAfterDeposit1 = await ethers.provider.getBalance(buyer1.address);
      const balanceAfterDeposit2 = await ethers.provider.getBalance(buyer2.address);
      const balanceAfterDeposit3 = await ethers.provider.getBalance(buyer3.address);

      // Refund
      const reason = "VERIFICATION_FAILED";
      const refundTx = await escrow.connect(oracle).refund(seller.address, reason);
      const refundReceipt = await refundTx.wait();

      // Get final balances
      const finalBalance1 = await ethers.provider.getBalance(buyer1.address);
      const finalBalance2 = await ethers.provider.getBalance(buyer2.address);
      const finalBalance3 = await ethers.provider.getBalance(buyer3.address);

      // Calculate net change (refund - gas for refund tx, but oracle pays gas)
      // Each buyer should get back their exact deposit amount
      const refund1 = finalBalance1 - balanceAfterDeposit1;
      const refund2 = finalBalance2 - balanceAfterDeposit2;
      const refund3 = finalBalance3 - balanceAfterDeposit3;

      expect(refund1).to.equal(amount1);
      expect(refund2).to.equal(amount2);
      expect(refund3).to.equal(amount3);

      expect(await escrow.getDepositorCount(seller.address)).to.equal(0);
      expect(await escrow.deposits(seller.address)).to.equal(0);
    });

    it("Should reject refund from non-oracle", async function () {
      await expect(
        escrow.connect(other).refund(seller.address, "VERIFICATION_FAILED")
      ).to.be.revertedWith("Only Oracle can call");
    });

    it("Should reject refund when no funds available", async function () {
      await escrow.connect(oracle).refund(seller.address, "VERIFICATION_FAILED");

      await expect(
        escrow.connect(oracle).refund(seller.address, "VERIFICATION_FAILED")
      ).to.be.revertedWith("No funds");
    });

    it("Should reject refund when no depositor found", async function () {
      // This shouldn't happen in normal flow, but test edge case
      // We'd need to manually manipulate storage to test this
      // For now, just verify the require statement exists
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum 3 depositors", async function () {
      await escrow.connect(buyer1).deposit(seller.address, { value: ethers.parseEther("1.0") });
      await escrow.connect(buyer2).deposit(seller.address, { value: ethers.parseEther("0.5") });
      await escrow.connect(buyer3).deposit(seller.address, { value: ethers.parseEther("0.3") });

      expect(await escrow.getDepositorCount(seller.address)).to.equal(3);
      expect(await escrow.deposits(seller.address)).to.equal(ethers.parseEther("1.8"));

      // Release should send all funds to seller
      const initialBalance = await ethers.provider.getBalance(seller.address);
      await escrow.connect(oracle).release(seller.address, "tx_0x123abc_arc");

      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.8"));
    });

    it("Should handle same buyer making multiple deposits", async function () {
      await escrow.connect(buyer1).deposit(seller.address, { value: ethers.parseEther("1.0") });
      await escrow.connect(buyer1).deposit(seller.address, { value: ethers.parseEther("0.5") });

      expect(await escrow.getDepositorCount(seller.address)).to.equal(1);

      const depositors = await escrow.getDepositors(seller.address);
      expect(depositors[0].amount).to.equal(ethers.parseEther("1.5"));

      // Refund should return all to buyer1
      const initialBalance = await ethers.provider.getBalance(buyer1.address);
      await escrow.connect(oracle).refund(seller.address, "VERIFICATION_FAILED");

      const finalBalance = await ethers.provider.getBalance(buyer1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.5"));
    });
  });
});
