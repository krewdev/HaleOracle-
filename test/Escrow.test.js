const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
  let escrow;
  let owner;
  let oracle;
  let seller;
  let depositor;
  let other;

  beforeEach(async function () {
    [owner, oracle, seller, depositor, other] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(oracle.address);
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
    it("Should allow deposits", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(escrow.connect(depositor).deposit(seller.address, { value: amount }))
        .to.emit(escrow, "Deposit")
        .withArgs(seller.address, depositor.address, amount);

      expect(await escrow.getBalance(seller.address)).to.equal(amount);
    });

    it("Should reject zero amount deposits", async function () {
      await expect(
        escrow.connect(depositor).deposit(seller.address, { value: 0 })
      ).to.be.revertedWith("Escrow: Deposit amount must be greater than 0");
    });

    it("Should reject deposits to zero address", async function () {
      await expect(
        escrow.connect(depositor).deposit(ethers.ZeroAddress, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Escrow: Zero address not allowed");
    });
  });

  describe("Release", function () {
    beforeEach(async function () {
      await escrow.connect(depositor).deposit(seller.address, {
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should allow oracle to release funds", async function () {
      const transactionId = "tx_0x123abc_arc";
      const initialBalance = await ethers.provider.getBalance(seller.address);
      
      await expect(escrow.connect(oracle).release(seller.address, transactionId))
        .to.emit(escrow, "Release")
        .withArgs(seller.address, ethers.parseEther("1.0"), transactionId);

      expect(await escrow.getBalance(seller.address)).to.equal(0);
      expect(await escrow.isTransactionReleased(transactionId)).to.be.true;
      
      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should reject release from non-oracle", async function () {
      await expect(
        escrow.connect(other).release(seller.address, "tx_0x123abc_arc")
      ).to.be.revertedWith("Escrow: Only HALE Oracle can call this function");
    });

    it("Should reject release when no funds available", async function () {
      await escrow.connect(oracle).release(seller.address, "tx_0x123abc_arc");
      
      await expect(
        escrow.connect(oracle).release(seller.address, "tx_0x456def_arc")
      ).to.be.revertedWith("Escrow: No funds to release");
    });

    it("Should reject duplicate transaction IDs", async function () {
      const transactionId = "tx_0x123abc_arc";
      await escrow.connect(oracle).release(seller.address, transactionId);
      
      await escrow.connect(depositor).deposit(seller.address, {
        value: ethers.parseEther("1.0"),
      });
      
      await expect(
        escrow.connect(oracle).release(seller.address, transactionId)
      ).to.be.revertedWith("Escrow: Transaction already processed");
    });
  });

  describe("Release Partial", function () {
    beforeEach(async function () {
      await escrow.connect(depositor).deposit(seller.address, {
        value: ethers.parseEther("2.0"),
      });
    });

    it("Should allow partial release", async function () {
      const transactionId = "tx_0x123abc_arc";
      const partialAmount = ethers.parseEther("0.5");
      
      await escrow.connect(oracle).releasePartial(seller.address, partialAmount, transactionId);
      
      expect(await escrow.getBalance(seller.address)).to.equal(ethers.parseEther("1.5"));
      expect(await escrow.isTransactionReleased(transactionId)).to.be.true;
    });

    it("Should reject partial release exceeding balance", async function () {
      await expect(
        escrow.connect(oracle).releasePartial(
          seller.address,
          ethers.parseEther("3.0"),
          "tx_0x123abc_arc"
        )
      ).to.be.revertedWith("Escrow: Insufficient funds");
    });
  });

  describe("Update Oracle", function () {
    it("Should allow owner to update oracle", async function () {
      const newOracle = other;
      
      await expect(escrow.connect(owner).updateOracle(newOracle.address))
        .to.emit(escrow, "OracleUpdated")
        .withArgs(oracle.address, newOracle.address);

      expect(await escrow.oracle()).to.equal(newOracle.address);
    });

    it("Should reject oracle update from non-owner", async function () {
      await expect(
        escrow.connect(other).updateOracle(other.address)
      ).to.be.revertedWith("Escrow: Only owner can call this function");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await escrow.connect(depositor).deposit(seller.address, {
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should return correct balance", async function () {
      expect(await escrow.getBalance(seller.address)).to.equal(ethers.parseEther("1.0"));
    });

    it("Should track transactions", async function () {
      const transactionId = "tx_0x123abc_arc";
      await escrow.connect(oracle).release(seller.address, transactionId);
      
      expect(await escrow.isTransactionReleased(transactionId)).to.be.true;
      
      const transactions = await escrow.getSellerTransactions(seller.address);
      expect(transactions).to.include(transactionId);
    });

    it("Should return contract info", async function () {
      const [oracleAddress, ownerAddress, contractBalance] = await escrow.getContractInfo();
      
      expect(oracleAddress).to.equal(oracle.address);
      expect(ownerAddress).to.equal(owner.address);
      expect(contractBalance).to.equal(ethers.parseEther("1.0"));
    });
  });
});
