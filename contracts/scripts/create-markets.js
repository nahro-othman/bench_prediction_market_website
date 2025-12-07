const hre = require("hardhat");

const MARKETS = [
  {
    question: "Will Bitcoin hit $100k in 2025?",
    options: ["Yes", "No"],
    description: "Predict if Bitcoin will reach $100,000 by December 31, 2025",
    sport: "crypto",
    daysUntilClose: 30
  },
  {
    question: "Champions League Winner 2024/25",
    options: ["Real Madrid", "Man City", "Bayern", "Other"],
    description: "Which club will win the UEFA Champions League this season?",
    sport: "football",
    daysUntilClose: 180
  },
  {
    question: "Will Mbappé score 30+ La Liga goals?",
    options: ["Yes", "No"],
    description: "Will Kylian Mbappé score 30 or more league goals in his first La Liga season?",
    sport: "football",
    daysUntilClose: 150
  },
  {
    question: "World Cup 2026 Winner",
    options: ["Brazil", "France", "Argentina", "Other"],
    description: "Which national team will lift the FIFA World Cup trophy in 2026?",
    sport: "football",
    daysUntilClose: 365
  },
  {
    question: "Will Ethereum reach $5,000 in 2025?",
    options: ["Yes", "No"],
    description: "Predict if Ethereum will hit $5,000 by end of 2025",
    sport: "crypto",
    daysUntilClose: 60
  }
];

async function main() {
  console.log("🎯 Creating Multiple Markets on Avalanche Fuji...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "AVAX\n");

  const predictionMarket = await hre.ethers.getContractAt(
    "PredictionMarket",
    "0xc727DE7b10a17813062E97887cb255C327E21a63"
  );

  // Check current market count
  const startCount = await predictionMarket.marketCount();
  console.log("📊 Starting market count:", startCount.toString());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const createdMarkets = [];

  for (let i = 0; i < MARKETS.length; i++) {
    const market = MARKETS[i];
    const marketId = (Number(startCount) + i).toString();
    
    console.log(`🏗️  Creating Market ${i + 1}/${MARKETS.length}:`);
    console.log(`   ID: ${marketId}`);
    console.log(`   Question: ${market.question}`);
    console.log(`   Options: ${market.options.join(", ")}`);
    
    const closeTime = Math.floor(Date.now() / 1000) + (market.daysUntilClose * 24 * 60 * 60);
    const closeDate = new Date(closeTime * 1000);
    console.log(`   Closes: ${closeDate.toLocaleDateString()}`);
    
    try {
      const tx = await predictionMarket.createMarket(
        market.question,
        market.options,
        closeTime
      );
      
      console.log(`   TX: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Confirmed!`);
      
      createdMarkets.push({
        id: marketId,
        question: market.question,
        options: market.options,
        description: market.description,
        sport: market.sport,
        closeTime: closeTime,
        closeDate: closeDate.toISOString(),
        txHash: tx.hash
      });
      
      console.log("");
    } catch (error) {
      console.error(`   ❌ Failed:`, error.message);
      console.log("");
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 MARKETS CREATED!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Output market details for Firestore sync
  console.log("📋 Market Details for Firestore:\n");
  createdMarkets.forEach(m => {
    console.log(`Market ID: ${m.id}`);
    console.log(`Title: ${m.question}`);
    console.log(`Options: ${m.options.join(", ")}`);
    console.log(`Description: ${m.description}`);
    console.log(`Sport: ${m.sport}`);
    console.log(`Close Date: ${m.closeDate}`);
    console.log(`TX: https://testnet.snowtrace.io/tx/${m.txHash}`);
    console.log("");
  });

  console.log("✅ Total markets created:", createdMarkets.length);
  console.log("\n🎊 All markets are now on the blockchain!");
  console.log("   Now syncing to Firestore...");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
