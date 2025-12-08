const hre = require("hardhat");

async function main() {
  console.log("🎯 Creating Test Market on Avalanche Fuji...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "AVAX\n");

  const predictionMarket = await hre.ethers.getContractAt(
    "PredictionMarket",
    "0xc727DE7b10a17813062E97887cb255C327E21a63"
  );

  // Check current market count
  const currentCount = await predictionMarket.marketCount();
  console.log("📊 Current market count:", currentCount.toString());
  
  // Create new market
  const question = "Will Bitcoin hit $100k in 2025?";
  const options = ["Yes", "No"];
  const closeTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
  
  console.log("\n🏗️  Creating market:");
  console.log("   Question:", question);
  console.log("   Options:", options.join(", "));
  console.log("   Close time:", new Date(closeTime * 1000).toISOString());
  
  const tx = await predictionMarket.createMarket(question, options, closeTime);
  console.log("\n⏳ Transaction sent:", tx.hash);
  console.log("   View on Snowtrace: https://testnet.snowtrace.io/tx/" + tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  
  // Market ID is the current count (0-indexed)
  const newMarketId = currentCount.toString();
  
  console.log("\n🎉 TEST MARKET CREATED!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Market ID:", newMarketId);
  console.log("Question:", question);
  console.log("Blockchain TX:", tx.hash);
  console.log("Snowtrace:", "https://testnet.snowtrace.io/tx/" + tx.hash);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ Now sync this to Firestore:");
  console.log("   Market ID:", newMarketId);
  console.log("   Title:", question);
  console.log("   Options: ['Yes', 'No']");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


