# 🚀 Bench Deployment Guide - Avalanche Hackathon

Complete guide to deploying your prediction market to Avalanche Fuji testnet and beyond.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ **MetaMask** with Avalanche Fuji testnet configured
- ✅ **Test AVAX** from https://faucet.avax.network/
- ✅ **Firebase project** set up (bench-prediction-market)
- ✅ **Snowtrace API key** (optional, for contract verification)
- ✅ **Private key** exported from MetaMask

## 🔐 Security Setup

### 1. Export Private Key from MetaMask

⚠️ **NEVER share your private key or commit it to Git!**

1. Open MetaMask
2. Click the three dots → Account Details
3. Export Private Key
4. Enter password and copy the key

### 2. Create Environment Files

#### `/contracts/.env`

```bash
# Your deployer private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Avalanche RPC URLs (optional - uses public RPCs by default)
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_MAINNET_RPC=https://api.avax.network/ext/bc/C/rpc

# Snowtrace API key for contract verification
SNOWTRACE_API_KEY=your_snowtrace_api_key_here
```

#### Root `.env` (update after deployment)

```bash
# Firebase Config
PUBLIC_FIREBASE_API_KEY=your-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=bench-prediction-market.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=bench-prediction-market
PUBLIC_FIREBASE_STORAGE_BUCKET=bench-prediction-market.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
PUBLIC_FIREBASE_APP_ID=your-app-id

# Avalanche Network
PUBLIC_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PUBLIC_CHAIN_ID=43113

# Smart Contract Addresses (add after deployment)
PUBLIC_TOKEN_CONTRACT=
PUBLIC_X402_CONTRACT=
PUBLIC_ORACLE_CONTRACT=
PUBLIC_PREDICTION_MARKET_CONTRACT=
```

#### `/functions/.env`

```bash
# Blockchain integration for Cloud Functions
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
BLOCKCHAIN_PRIVATE_KEY=your_backend_private_key_here

# Contract addresses (add after deployment)
PREDICTION_MARKET_CONTRACT=
ORACLE_CONTRACT=

# Oracle API key (for external data submission)
ORACLE_API_KEY=your_secure_api_key_here
```

## 🏗️ Step-by-Step Deployment

### Step 1: Compile Smart Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

Expected output:
```
Compiled 4 Solidity files successfully
```

### Step 2: Run Tests

```bash
npx hardhat test
```

All tests should pass ✅

### Step 3: Deploy to Fuji Testnet

```bash
npx hardhat run scripts/deploy.js --network fuji
```

Expected output:
```
🚀 Deploying Bench Prediction Market to Avalanche...

📝 Deploying contracts with account: 0x...
💰 Account balance: 10.0 AVAX

📦 Deploying ERC8004Token...
✅ ERC8004Token deployed to: 0x...

📦 Deploying X402Payment...
✅ X402Payment deployed to: 0x...

📦 Deploying Oracle...
✅ Oracle deployed to: 0x...

📦 Deploying PredictionMarket...
✅ PredictionMarket deployed to: 0x...

⚙️  Configuring contracts...
✅ Authorized PredictionMarket for conditional transfers
✅ Set deployer as oracle
✅ Authorized deployer in Oracle contract

📄 Deployment info saved to: fuji-1733356800000.json

============================================================
✅ DEPLOYMENT COMPLETE!
============================================================

📋 Contract Addresses:
   ERC8004Token:       0xABC...
   X402Payment:        0xDEF...
   Oracle:             0xGHI...
   PredictionMarket:   0xJKL...

📝 Add these to your .env file:
   PUBLIC_TOKEN_CONTRACT=0xABC...
   PUBLIC_X402_CONTRACT=0xDEF...
   PUBLIC_ORACLE_CONTRACT=0xGHI...
   PUBLIC_PREDICTION_MARKET_CONTRACT=0xJKL...
```

### Step 4: Update Environment Variables

1. Copy the contract addresses from deployment output
2. Update root `.env` file with the addresses
3. Update `/functions/.env` with the addresses

### Step 5: Verify Contracts on Snowtrace

```bash
npx hardhat verify --network fuji 0xABC... "Bench Credit" "BENCH" "1000000000000000000000000"
npx hardhat verify --network fuji 0xDEF...
npx hardhat verify --network fuji 0xGHI...
npx hardhat verify --network fuji 0xJKL... 0xDEF... 0xABC...
```

### Step 6: Deploy Cloud Functions

```bash
cd ../functions
npm install
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

### Step 7: Deploy Frontend

```bash
cd ..
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

## 🧪 Testing on Fuji Testnet

### 1. Connect MetaMask

1. Open your deployed app
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. MetaMask should auto-switch to Fuji

### 2. Get Test AVAX

Visit https://faucet.avax.network/ and request test AVAX

### 3. Test Market Creation

```javascript
// In browser console
const { predictionMarketContract } = await import('./src/lib/services/web3/contracts');

const closeTime = Math.floor(Date.now() / 1000) + 86400; // +1 day
const result = await predictionMarketContract.createMarket(
  "Will Bitcoin reach $100k by end of year?",
  ["Yes", "No"],
  closeTime
);

console.log('Market created:', result.marketId);
```

### 4. Test Betting

1. Browse to a market
2. Click YES or NO
3. Confirm transaction in MetaMask
4. Wait for confirmation (~1 second on Avalanche!)
5. Check your position in account page

### 5. Test Settlement

```javascript
// Admin only - settle market
const result = await predictionMarketContract.settleMarket(
  "1", // marketId
  0    // winningOption (0 = first option)
);

console.log('Market settled:', result.txHash);
```

## 📊 Monitoring & Analytics

### Snowtrace Explorer

View your contracts on Fuji testnet:
- https://testnet.snowtrace.io/address/YOUR_CONTRACT_ADDRESS

### Firebase Console

Monitor Cloud Functions:
- https://console.firebase.google.com/project/bench-prediction-market/functions

### Contract Events

Listen to events in your app:

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(
  'https://api.avax-test.network/ext/bc/C/rpc'
);

const contract = new ethers.Contract(
  PREDICTION_MARKET_ADDRESS,
  PREDICTION_MARKET_ABI,
  provider
);

// Listen for bets
contract.on('BetPlaced', (marketId, positionId, bettor, optionId, isYes, stake) => {
  console.log('New bet placed:', {
    marketId: marketId.toString(),
    bettor,
    stake: ethers.formatEther(stake)
  });
});
```

## 🚀 Deploying to Mainnet

⚠️ **CRITICAL: Audit contracts before mainnet deployment!**

### Pre-Mainnet Checklist

- [ ] All contracts thoroughly tested on Fuji
- [ ] Security audit completed
- [ ] Gas optimizations reviewed
- [ ] Admin keys secured (use multi-sig)
- [ ] Emergency pause mechanism tested
- [ ] Oracle data sources verified
- [ ] Legal compliance reviewed

### Mainnet Deployment

```bash
# Update hardhat.config.js to use mainnet
# Ensure you have real AVAX for gas fees

cd contracts
npx hardhat run scripts/deploy.js --network mainnet

# Verify contracts
npx hardhat verify --network mainnet ...
```

### Post-Deployment

1. **Transfer ownership** to multi-sig wallet
2. **Set up monitoring** (Tenderly, Defender)
3. **Configure alerts** for critical events
4. **Update frontend** with mainnet addresses
5. **Announce launch** 🎉

## 🐛 Troubleshooting

### "Insufficient funds" error

→ Get more test AVAX from faucet

### "Nonce too high" error

→ Reset MetaMask account: Settings → Advanced → Reset Account

### Contract deployment fails

→ Check you have enough AVAX for gas
→ Verify RPC URL is correct
→ Try increasing gas limit in hardhat.config.js

### Transactions not confirming

→ Avalanche Fuji is usually instant
→ Check Snowtrace for transaction status
→ Verify you're on correct network

### Frontend can't connect to contracts

→ Verify contract addresses in .env
→ Check MetaMask is on Fuji network
→ Clear browser cache and reload

## 📚 Additional Resources

- **Avalanche Docs**: https://docs.avax.network/
- **Hardhat Docs**: https://hardhat.org/docs
- **Ethers.js Docs**: https://docs.ethers.org/
- **Firebase Docs**: https://firebase.google.com/docs

## 🆘 Need Help?

- 📧 Email: team@bench.markets
- 💬 Discord: [Your Discord]
- 🐛 GitHub Issues: [Your Repo]

---

**Ready to deploy!** 🚀

Follow these steps carefully and your prediction market will be live on Avalanche in no time!

**#AvalancheHackathon #x402 #ERC8004 #Web3**


