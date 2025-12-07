# 🧪 Bench Testing Guide - Avalanche Integration

Complete testing guide for your blockchain-integrated prediction market.

## 📋 Testing Checklist

### ✅ Local Testing (Hardhat)

- [ ] Smart contract unit tests pass
- [ ] Integration tests pass
- [ ] Gas usage is optimized
- [ ] Edge cases handled

### ✅ Fuji Testnet Testing

- [ ] Contracts deployed successfully
- [ ] Contracts verified on Snowtrace
- [ ] MetaMask connection works
- [ ] Market creation works
- [ ] Betting works (YES/NO)
- [ ] x402 payments process correctly
- [ ] Oracle data submission works
- [ ] Market settlement works
- [ ] Payout claims work
- [ ] Real-time updates work
- [ ] Mobile responsive

### ✅ Integration Testing

- [ ] Frontend ↔ Smart Contracts
- [ ] Frontend ↔ Firebase
- [ ] Cloud Functions ↔ Smart Contracts
- [ ] Oracle ↔ Smart Contracts
- [ ] Event listeners working

## 🏃 Running Tests

### 1. Smart Contract Tests

```bash
cd contracts

# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/PredictionMarket.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

Expected output:
```
  PredictionMarket
    Market Creation
      ✓ Should create a market successfully (150ms)
      ✓ Should reject market with invalid close time (50ms)
    Betting
      ✓ Should place a bet successfully (200ms)
      ✓ Should reject bet with insufficient payment (80ms)
      ✓ Should reject bet on closed market (100ms)
    Settlement
      ✓ Should settle market successfully (250ms)
      ✓ Should calculate correct payouts (120ms)
    X402 Integration
      ✓ Should create payment when placing bet (180ms)

  8 passing (1.2s)
```

### 2. Local Blockchain Testing

Start a local Hardhat node:

```bash
# Terminal 1: Start node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Run frontend
cd ..
npm run dev
```

Connect MetaMask to localhost:8545

### 3. Fuji Testnet Testing

#### Deploy to Fuji

```bash
cd contracts
npx hardhat run scripts/deploy.js --network fuji
```

#### Update Environment Variables

Copy contract addresses to `.env`:

```bash
PUBLIC_TOKEN_CONTRACT=0x...
PUBLIC_X402_CONTRACT=0x...
PUBLIC_ORACLE_CONTRACT=0x...
PUBLIC_PREDICTION_MARKET_CONTRACT=0x...
```

#### Start Frontend

```bash
npm run dev
```

## 🎯 Manual Testing Scenarios

### Scenario 1: Complete Market Lifecycle

**Objective**: Test full market from creation to settlement

1. **Create Market**
   - Connect wallet
   - Navigate to admin page
   - Create market: "Will it rain tomorrow?"
   - Options: ["Yes", "No"]
   - Close time: Tomorrow
   - ✅ Verify transaction on Snowtrace
   - ✅ Verify market appears on home page

2. **Place Bets**
   - User 1: Bet 1 AVAX on YES
   - User 2: Bet 2 AVAX on NO
   - User 3: Bet 0.5 AVAX on YES
   - ✅ Verify balances decrease
   - ✅ Verify probabilities update
   - ✅ Verify positions appear in account

3. **Close Market**
   - Wait for close time OR admin close
   - ✅ Verify status changes to "closed"
   - ✅ Verify betting is disabled

4. **Settle Market**
   - Admin: Submit oracle data
   - Admin: Settle with winning option
   - ✅ Verify settlement transaction
   - ✅ Verify positions marked as won/lost

5. **Claim Payouts**
   - Winners: Claim payouts
   - ✅ Verify tokens received
   - ✅ Verify correct payout amounts

### Scenario 2: x402 Payment Flow

**Objective**: Test streamlined payment system

1. **Initiate Payment**
   - Place bet with 1 AVAX
   - ✅ Verify payment initiated event
   - ✅ Verify payment streaming events

2. **Monitor Payment**
   - Check x402 contract for payment status
   - ✅ Verify payment completed
   - ✅ Verify recipient received funds

3. **Verify Gas Savings**
   - Compare gas used vs standard ERC20
   - ✅ Target: 30% gas reduction

### Scenario 3: Oracle Integration

**Objective**: Test external data fetching

1. **Request Data**
   - Create market requiring oracle
   - Request external data
   - ✅ Verify request event emitted

2. **Submit Data**
   - Oracle: Fetch external data
   - Oracle: Submit to contract
   - ✅ Verify data submission event
   - ✅ Verify consensus reached

3. **Use Data**
   - Settle market with oracle data
   - ✅ Verify correct outcome
   - ✅ Verify payouts match data

### Scenario 4: Edge Cases

**Test edge cases and error handling**

1. **Insufficient Balance**
   - Try to bet more than you have
   - ✅ Verify error message
   - ✅ Verify transaction reverts

2. **Closed Market**
   - Try to bet on closed market
   - ✅ Verify error message
   - ✅ Verify transaction reverts

3. **Invalid Option**
   - Try to bet on non-existent option
   - ✅ Verify error message
   - ✅ Verify transaction reverts

4. **Double Settlement**
   - Try to settle already settled market
   - ✅ Verify error message
   - ✅ Verify transaction reverts

5. **Unauthorized Settlement**
   - Non-admin tries to settle
   - ✅ Verify error message
   - ✅ Verify transaction reverts

## 🔍 Testing Tools

### Snowtrace (Fuji Explorer)

View transactions and contracts:
```
https://testnet.snowtrace.io/address/YOUR_CONTRACT_ADDRESS
```

### Hardhat Console

Interactive testing:
```bash
npx hardhat console --network fuji

> const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
> const market = await PredictionMarket.attach("0x...");
> const count = await market.marketCount();
> console.log("Market count:", count.toString());
```

### Browser Console

Test frontend integration:
```javascript
// Get wallet info
const wallet = await window.ethereum.request({ method: 'eth_requestAccounts' });
console.log('Connected wallet:', wallet[0]);

// Check network
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
console.log('Chain ID:', chainId); // Should be 0xa869 (43113) for Fuji

// Test contract call
const { predictionMarketContract } = await import('/src/lib/services/web3/contracts.ts');
const count = await predictionMarketContract.getMarketCount();
console.log('Markets:', count);
```

## 📊 Performance Testing

### Gas Usage

Target gas costs (Fuji):

| Operation | Target Gas | Actual Gas | Status |
|-----------|-----------|------------|--------|
| Create Market | < 200k | TBD | ⏳ |
| Place Bet | < 150k | TBD | ⏳ |
| Settle Market | < 300k | TBD | ⏳ |
| Claim Payout | < 100k | TBD | ⏳ |

### Transaction Speed

Avalanche targets:
- **Block time**: ~2 seconds
- **Finality**: < 1 second
- **Confirmation**: 1 block

Test and verify:
```javascript
const start = Date.now();
const tx = await contract.placeBet(...);
const receipt = await tx.wait();
const duration = Date.now() - start;
console.log(`Transaction confirmed in ${duration}ms`);
// Target: < 3000ms
```

### Concurrent Users

Test with multiple wallets:
1. Create 10 test wallets
2. Fund each with test AVAX
3. Have all place bets simultaneously
4. ✅ Verify all transactions succeed
5. ✅ Verify correct state updates

## 🐛 Common Issues & Solutions

### Issue: "Nonce too high"

**Solution**: Reset MetaMask account
```
Settings → Advanced → Reset Account
```

### Issue: "Insufficient funds for gas"

**Solution**: Get more test AVAX
```
https://faucet.avax.network/
```

### Issue: Contract call fails

**Solution**: Check contract address and ABI
```javascript
console.log('Contract address:', CONTRACT_ADDRESS);
console.log('Network:', await provider.getNetwork());
```

### Issue: Events not firing

**Solution**: Check event listeners
```javascript
contract.on('BetPlaced', (...args) => {
  console.log('Event received:', args);
});
```

## 📝 Test Results Template

Document your test results:

```markdown
## Test Run: [Date]

### Environment
- Network: Fuji Testnet
- Contracts: [Addresses]
- Tester: [Name]

### Results

#### Smart Contracts
- [x] All unit tests pass
- [x] Gas usage acceptable
- [x] Edge cases handled

#### Frontend
- [x] Wallet connection works
- [x] Market creation works
- [x] Betting works
- [x] Real-time updates work

#### Integration
- [x] Blockchain ↔ Frontend
- [x] Blockchain ↔ Cloud Functions
- [x] Oracle integration

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Status: Fixed/Open
   - Fix: [Description]

### Performance
- Average bet confirmation: 2.1s
- Average gas cost: 145k
- Concurrent users tested: 10

### Conclusion
✅ Ready for hackathon demo
⏳ Minor improvements needed
❌ Critical issues found
```

## 🎬 Demo Script

For hackathon presentation:

1. **Introduction** (30s)
   - "Bench: AI + Blockchain prediction market on Avalanche"

2. **Connect Wallet** (15s)
   - Show MetaMask connection
   - Highlight Avalanche Fuji network

3. **Browse Markets** (30s)
   - Show real-time market cards
   - Explain probability updates

4. **Place Bet** (45s)
   - Click YES on a market
   - Show MetaMask confirmation
   - Highlight sub-second confirmation
   - Show position in account

5. **Show x402 Benefits** (30s)
   - "No approval transaction needed"
   - "30% gas savings"
   - "Instant finality"

6. **Admin Features** (45s)
   - Create new market
   - Show oracle integration
   - Settle market
   - Show payouts

7. **Technical Architecture** (60s)
   - Show diagram
   - Explain 3-layer system
   - Highlight AI + Blockchain integration

8. **Q&A** (remaining time)

**Total: ~4 minutes**

## ✅ Final Checklist

Before hackathon submission:

- [ ] All tests passing
- [ ] Contracts deployed to Fuji
- [ ] Contracts verified on Snowtrace
- [ ] Frontend deployed
- [ ] Demo script practiced
- [ ] Video recorded
- [ ] Documentation complete
- [ ] GitHub repo public
- [ ] README updated
- [ ] Team info added

---

**Ready to test!** 🧪

Follow this guide to ensure your prediction market is rock-solid for the hackathon demo!

**#AvalancheHackathon #Testing #x402 #ERC8004**




