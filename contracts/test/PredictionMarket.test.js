const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket", function () {
  let predictionMarket;
  let x402Payment;
  let token;
  let oracle;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy ERC8004Token
    const ERC8004Token = await ethers.getContractFactory("ERC8004Token");
    token = await ERC8004Token.deploy(
      "Bench Credit",
      "BENCH",
      ethers.parseEther("1000000")
    );
    await token.waitForDeployment();

    // Deploy X402Payment
    const X402Payment = await ethers.getContractFactory("X402Payment");
    x402Payment = await X402Payment.deploy();
    await x402Payment.waitForDeployment();

    // Deploy Oracle
    const Oracle = await ethers.getContractFactory("Oracle");
    oracle = await Oracle.deploy();
    await oracle.waitForDeployment();

    // Deploy PredictionMarket
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy(
      await x402Payment.getAddress(),
      await token.getAddress()
    );
    await predictionMarket.waitForDeployment();

    // Authorize contracts
    await token.authorizeContract(await predictionMarket.getAddress(), true);
    await predictionMarket.setOracle(owner.address, true);
  });

  describe("Market Creation", function () {
    it("Should create a market successfully", async function () {
      const closeTime = (await time.latest()) + 86400; // +1 day
      const tx = await predictionMarket.createMarket(
        "Who will win?",
        ["Team A", "Team B"],
        closeTime
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "MarketCreated");
      
      expect(event).to.not.be.undefined;
      
      const marketId = event.args[0];
      const marketDetails = await predictionMarket.getMarket(marketId);
      
      expect(marketDetails[1]).to.equal("Who will win?");
      expect(marketDetails[2]).to.deep.equal(["Team A", "Team B"]);
    });

    it("Should reject market with invalid close time", async function () {
      const pastTime = (await time.latest()) - 100;
      await expect(
        predictionMarket.createMarket("Test", ["A", "B"], pastTime)
      ).to.be.revertedWith("Close time must be in future");
    });
  });

  describe("Betting", function () {
    let marketId;
    let closeTime;

    beforeEach(async function () {
      closeTime = (await time.latest()) + 86400;
      const tx = await predictionMarket.createMarket(
        "Test Market",
        ["Option A", "Option B"],
        closeTime
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "MarketCreated");
      marketId = event.args[0];
    });

    it("Should place a bet successfully", async function () {
      const betAmount = ethers.parseEther("1");
      
      const tx = await predictionMarket.connect(user1).placeBet(
        marketId,
        0, // Option A
        true, // YES
        betAmount,
        { value: betAmount }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "BetPlaced");
      
      expect(event).to.not.be.undefined;
      expect(event.args[2]).to.equal(user1.address);
    });

    it("Should reject bet with insufficient payment", async function () {
      const betAmount = ethers.parseEther("1");
      
      await expect(
        predictionMarket.connect(user1).placeBet(
          marketId,
          0,
          true,
          betAmount,
          { value: ethers.parseEther("0.5") }
        )
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should reject bet on closed market", async function () {
      // Fast forward time
      await time.increaseTo(closeTime + 1);
      
      const betAmount = ethers.parseEther("1");
      await expect(
        predictionMarket.connect(user1).placeBet(
          marketId,
          0,
          true,
          betAmount,
          { value: betAmount }
        )
      ).to.be.revertedWith("Market closed");
    });
  });

  describe("Settlement", function () {
    let marketId;
    let position1;
    let position2;

    beforeEach(async function () {
      const closeTime = (await time.latest()) + 86400;
      const tx = await predictionMarket.createMarket(
        "Settlement Test",
        ["Winner", "Loser"],
        closeTime
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "MarketCreated");
      marketId = event.args[0];

      // Place bets
      const betAmount1 = ethers.parseEther("1");
      const tx1 = await predictionMarket.connect(user1).placeBet(
        marketId,
        0,
        true,
        betAmount1,
        { value: betAmount1 }
      );
      const receipt1 = await tx1.wait();
      position1 = receipt1.logs.find(log => log.fragment?.name === "BetPlaced").args[1];

      const betAmount2 = ethers.parseEther("1");
      const tx2 = await predictionMarket.connect(user2).placeBet(
        marketId,
        1,
        true,
        betAmount2,
        { value: betAmount2 }
      );
      const receipt2 = await tx2.wait();
      position2 = receipt2.logs.find(log => log.fragment?.name === "BetPlaced").args[1];

      // Close market
      await time.increaseTo(closeTime + 1);
      await predictionMarket.closeMarket(marketId);
    });

    it("Should settle market successfully", async function () {
      await predictionMarket.settleMarket(marketId, 0); // Winner is option 0
      
      const marketDetails = await predictionMarket.getMarket(marketId);
      expect(marketDetails[6]).to.equal(2); // MarketStatus.Settled
    });

    it("Should calculate correct payouts", async function () {
      await predictionMarket.settleMarket(marketId, 0);
      
      const payout1 = await predictionMarket.calculatePayout(position1);
      const payout2 = await predictionMarket.calculatePayout(position2);
      
      expect(payout1).to.be.gt(0); // Winner gets payout
      expect(payout2).to.equal(0); // Loser gets nothing
    });
  });

  describe("X402 Integration", function () {
    it("Should create payment when placing bet", async function () {
      const closeTime = (await time.latest()) + 86400;
      const tx1 = await predictionMarket.createMarket(
        "X402 Test",
        ["A", "B"],
        closeTime
      );
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(log => log.fragment?.name === "MarketCreated");
      const marketId = event1.args[0];

      const betAmount = ethers.parseEther("1");
      await predictionMarket.connect(user1).placeBet(
        marketId,
        0,
        true,
        betAmount,
        { value: betAmount }
      );

      const totalPayments = await x402Payment.totalPayments();
      expect(totalPayments).to.be.gt(0);
    });
  });
});

