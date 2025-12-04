/**
 * Deployment script for Bench Prediction Market
 * Deploys all contracts to Avalanche network
 * 
 * Usage:
 * npx hardhat run scripts/deploy.js --network fuji
 * npx hardhat run scripts/deploy.js --network mainnet
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Bench Prediction Market to Avalanche...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "AVAX\n");

  // 1. Deploy ERC8004Token
  console.log("📦 Deploying ERC8004Token...");
  const ERC8004Token = await hre.ethers.getContractFactory("ERC8004Token");
  const token = await ERC8004Token.deploy(
    "Bench Credit",
    "BENCH",
    hre.ethers.parseEther("1000000") // 1M tokens
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ ERC8004Token deployed to:", tokenAddress);

  // 2. Deploy X402Payment
  console.log("\n📦 Deploying X402Payment...");
  const X402Payment = await hre.ethers.getContractFactory("X402Payment");
  const x402 = await X402Payment.deploy();
  await x402.waitForDeployment();
  const x402Address = await x402.getAddress();
  console.log("✅ X402Payment deployed to:", x402Address);

  // 3. Deploy PredictionMarket
  console.log("\n📦 Deploying PredictionMarket...");
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const market = await PredictionMarket.deploy(x402Address, tokenAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("✅ PredictionMarket deployed to:", marketAddress);

  // 4. Configure contracts
  console.log("\n⚙️  Configuring contracts...");
  
  // Authorize PredictionMarket contract for conditional transfers
  const authTx = await token.authorizeContract(marketAddress, true);
  await authTx.wait();
  console.log("✅ Authorized PredictionMarket for conditional transfers");

  // 6. Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ERC8004Token: tokenAddress,
      X402Payment: x402Address,
      PredictionMarket: marketAddress,
    },
    // Generate env variables
    envVariables: {
      PUBLIC_TOKEN_CONTRACT: tokenAddress,
      PUBLIC_X402_CONTRACT: x402Address,
      PUBLIC_PREDICTION_MARKET_CONTRACT: marketAddress,
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  // Also write latest.json for easy access
  const latestPath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", filename);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   ERC8004Token:      ", tokenAddress);
  console.log("   X402Payment:       ", x402Address);
  console.log("   PredictionMarket:  ", marketAddress);
  
  console.log("\n📝 Add these to your .env file:");
  console.log("   PUBLIC_TOKEN_CONTRACT=" + tokenAddress);
  console.log("   PUBLIC_X402_CONTRACT=" + x402Address);
  console.log("   PUBLIC_PREDICTION_MARKET_CONTRACT=" + marketAddress);

  if (hre.network.name === "fuji" || hre.network.name === "mainnet") {
    console.log("\n🔍 Verify contracts on Snowtrace:");
    console.log("   npx hardhat verify --network " + hre.network.name + " " + tokenAddress + ' "Bench Credit" "BENCH" "1000000000000000000000000"');
    console.log("   npx hardhat verify --network " + hre.network.name + " " + x402Address);
    console.log("   npx hardhat verify --network " + hre.network.name + " " + marketAddress + " " + x402Address + " " + tokenAddress);
  }

  console.log("\n🎉 Ready to integrate with frontend!");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

