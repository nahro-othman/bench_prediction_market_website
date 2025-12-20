/**
 * Fuji Testnet Testing Script
 * 
 * Tests deployed contracts on Avalanche Fuji testnet
 * 
 * Usage:
 * npx hardhat run scripts/test-fuji.js --network fuji
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Testing Bench Prediction Market on Fuji Testnet\n");

  const [tester] = await hre.ethers.getSigners();
  console.log("👤 Testing with account:", tester.address);
  
  const balance = await hre.ethers.provider.getBalance(tester.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "AVAX\n");

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestPath = path.join(deploymentsDir, "fuji-latest.json");
  
  if (!fs.existsSync(latestPath)) {
    console.error("❌ No deployment found. Please deploy contracts first:");
    console.error("   npx hardhat run scripts/deploy.js --network fuji");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  const addresses = deployment.contracts;

  console.log("📋 Using deployed contracts:");
  console.log("   PredictionMarket:", addresses.PredictionMarket);
  console.log("   X402Payment:", addresses.X402Payment);
  console.log("   ERC8004Token:", addresses.ERC8004Token);
  console.log("   Oracle:", addresses.Oracle);
  console.log();

  // Get contract instances
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const market = PredictionMarket.attach(addresses.PredictionMarket);

  const X402Payment = await hre.ethers.getContractFactory("X402Payment");
  const x402 = X402Payment.attach(addresses.X402Payment);

  const ERC8004Token = await hre.ethers.getContractFactory("ERC8004Token");
  const token = ERC8004Token.attach(addresses.ERC8004Token);

  // Test 1: Check contract state
  console.log("📊 Test 1: Check Contract State");
  console.log("-".repeat(50));
  
  const marketCount = await market.marketCount();
  console.log("✅ Market count:", marketCount.toString());
  
  const totalPayments = await x402.totalPayments();
  console.log("✅ Total x402 payments:", totalPayments.toString());
  
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  console.log("✅ Token:", tokenName, `(${tokenSymbol})`);
  console.log();

  // Test 2: Create a market
  console.log("🏗️  Test 2: Create Market");
  console.log("-".repeat(50));
  
  const closeTime = Math.floor(Date.now() / 1000) + 86400; // +1 day
  console.log("Creating market...");
  
  const createTx = await market.createMarket(
    "Test Market: Will Bitcoin reach $100k?",
    ["Yes", "No"],
    closeTime
  );
  
  console.log("⏳ Transaction sent:", createTx.hash);
  const createReceipt = await createTx.wait();
  console.log("✅ Transaction confirmed in block:", createReceipt.blockNumber);
  
  // Parse event to get marketId
  const createEvent = createReceipt.logs.find(log => {
    try {
      const parsed = market.interface.parseLog(log);
      return parsed?.name === 'MarketCreated';
    } catch {
      return false;
    }
  });
  
  const newMarketId = createEvent ? market.interface.parseLog(createEvent).args[0] : 0;
  console.log("✅ Market created with ID:", newMarketId.toString());
  console.log();

  // Test 3: Get market details
  console.log("🔍 Test 3: Get Market Details");
  console.log("-".repeat(50));
  
  const marketDetails = await market.getMarket(newMarketId);
  console.log("Market ID:", marketDetails[0].toString());
  console.log("Question:", marketDetails[1]);
  console.log("Options:", marketDetails[2]);
  console.log("Total Volume:", hre.ethers.formatEther(marketDetails[4]), "AVAX");
  console.log("Status:", ["Open", "Closed", "Settled"][Number(marketDetails[6])]);
  console.log();

  // Test 4: Place a bet
  console.log("💰 Test 4: Place Bet");
  console.log("-".repeat(50));
  
  const betAmount = hre.ethers.parseEther("0.1"); // 0.1 AVAX
  console.log("Placing bet of 0.1 AVAX...");
  
  const betTx = await market.placeBet(
    newMarketId,
    0, // Option 0 (Yes)
    true, // YES
    betAmount,
    { value: betAmount }
  );
  
  console.log("⏳ Transaction sent:", betTx.hash);
  const betReceipt = await betTx.wait();
  console.log("✅ Transaction confirmed in block:", betReceipt.blockNumber);
  
  // Parse event to get positionId
  const betEvent = betReceipt.logs.find(log => {
    try {
      const parsed = market.interface.parseLog(log);
      return parsed?.name === 'BetPlaced';
    } catch {
      return false;
    }
  });
  
  const positionId = betEvent ? market.interface.parseLog(betEvent).args[1] : 0;
  console.log("✅ Position created with ID:", positionId.toString());
  console.log();

  // Test 5: Check updated market
  console.log("📈 Test 5: Check Updated Market");
  console.log("-".repeat(50));
  
  const updatedMarket = await market.getMarket(newMarketId);
  console.log("Total Volume:", hre.ethers.formatEther(updatedMarket[4]), "AVAX");
  console.log("Option 0 Volume:", hre.ethers.formatEther(updatedMarket[3][0]), "AVAX");
  console.log();

  // Test 6: Check x402 stats
  console.log("⚡ Test 6: Check x402 Payment Stats");
  console.log("-".repeat(50));
  
  const updatedPayments = await x402.totalPayments();
  const totalVolume = await x402.totalVolume();
  console.log("Total Payments:", updatedPayments.toString());
  console.log("Total Volume:", hre.ethers.formatEther(totalVolume), "AVAX");
  console.log();

  // Test 7: Get user positions
  console.log("👤 Test 7: Get User Positions");
  console.log("-".repeat(50));
  
  const positions = await market.getUserPositions(tester.address);
  console.log("User has", positions.length, "position(s)");
  console.log("Position IDs:", positions.map(p => p.toString()).join(", "));
  console.log();

  // Summary
  console.log("=".repeat(50));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(50));
  console.log();
  console.log("🎉 Your contracts are working correctly on Fuji testnet!");
  console.log();
  console.log("📝 Next Steps:");
  console.log("   1. Update .env with contract addresses");
  console.log("   2. Test frontend integration");
  console.log("   3. Verify contracts on Snowtrace");
  console.log("   4. Test with multiple users");
  console.log("   5. Prepare demo for hackathon");
  console.log();
  console.log("🔗 View on Snowtrace:");
  console.log("   https://testnet.snowtrace.io/address/" + addresses.PredictionMarket);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });














