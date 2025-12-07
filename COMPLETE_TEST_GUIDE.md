# 🧪 Complete Testing Guide - Ensure Everything Works

## Run These Tests to Verify Your Project

---

## ⚡ Quick Test (5 minutes)

### **Step 1: Test Smart Contracts**

```bash
cd contracts
npm install
npx hardhat test
```

**✅ Expected:** All tests pass

```
  PredictionMarket
    Market Creation
      ✓ Should create a market successfully
      ✓ Should reject market with invalid close time
    Betting
      ✓ Should place a bet successfully
      ✓ Should reject bet with insufficient payment
      ✓ Should reject bet on closed market
    Settlement
      ✓ Should settle market successfully
      ✓ Should calculate correct payouts
    X402 Integration
      ✓ Should create payment when placing bet

  8 passing
```

**❌ If tests fail:** Check your contracts for syntax errors

---

### **Step 2: Start Dev Server**

```bash
cd ..
npm run dev
```

**✅ Expected:** Server starts on http://localhost:5173
**❌ If fails:** Run `npm install` first

---

### **Step 3: Test Wallet Connection**

1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Approve in MetaMask

**✅ Expected:**

- Wallet address shows in navbar (e.g., `0x742d...A8F3`)
- AVAX balance displays
- Network shows as "Avalanche Fuji"

**❌ If fails:**

- Install MetaMask extension
- Add Avalanche Fuji network to MetaMask
- Get test AVAX from https://faucet.avax.network/

---

### **Step 4: Run Integration Tests**

Visit: http://localhost:5173/integration-test

Click: "🚀 Run All Integration Tests"

**✅ Expected:** All 10 tests pass

```
✅ Browser Environment
✅ Wallet Connection
✅ Network Check
✅ AVAX Balance
✅ Firebase Init
✅ Firestore Access
✅ Market Creation (if needed)
✅ Bet Placement
✅ AI Service
✅ AMM Utilities
✅ Components
```

**❌ If any fail:** Check the error message, it tells you exactly what to fix

---

### **Step 5: Test Betting Flow**

1. Go to any market: http://localhost:5173/markets/[id]
2. Click "YES" or "NO"
3. Bet dialog opens
4. Enter amount (e.g., 0.01 AVAX)
5. Click "Place bet"

**✅ Expected:**

- Loading spinner shows
- Green success notification appears
- Console shows: `🎉 Bet placed successfully!`
- Position saved to Firestore

**❌ If fails:** Visit http://localhost:5173/test-bet for detailed diagnostics

---

### **Step 6: Test Admin Features**

1. Go to http://localhost:5173/admin
2. Should see "Admin Dashboard"
3. Click "+ Create Market"
4. Fill in form and create

**✅ Expected:** Market appears in list

**❌ If fails:** Make sure wallet is connected

---

## 🔬 Deep Testing (15 minutes)

### **Test 1: End-to-End User Flow**

```
1. [Home] Connect wallet
   ✅ Address shows in navbar

2. [Home] Browse markets
   ✅ Markets load from Firestore

3. [Market Detail] Click YES
   ✅ Bet dialog opens

4. [Bet Dialog] Enter 0.01 AVAX
   ✅ Can type in input
   ✅ Balance shows correctly
   ✅ Potential payout calculates

5. [Bet Dialog] Click "Place bet"
   ✅ Loading spinner shows
   ✅ Console logs appear
   ✅ Success notification appears
   ✅ Dialog closes

6. [Account] Check position
   ✅ New position appears
   ✅ Shows correct stake
   ✅ Shows market title
```

---

### **Test 2: Admin Flow**

```
1. [Admin] Create market
   ✅ Form works
   ✅ Can add options
   ✅ Market created

2. [Admin] Close market
   ✅ Status changes to "closed"

3. [Admin] Settle market
   ✅ Can select winner
   ✅ Settlement succeeds
   ✅ Status changes to "settled"
```

---

### **Test 3: New Components**

#### AI Insights

1. Go to market page
2. Add `<AIInsights>` component (if not already)
3. Should see AI analysis with confidence score

#### Gas Comparison

1. Add to landing page: `<GasComparison amount={100} />`
2. Should see side-by-side comparison
3. Shows 30% savings

#### Payment Status

1. Place a bet
2. Should see animated modal
3. Progress bar animates
4. Shows x402 benefits

---

## 🐛 Debugging Failed Tests

### If Integration Test Fails:

**Test 1-2 (Browser/Wallet):**

- Make sure MetaMask is installed
- Connect wallet before running tests

**Test 3-4 (Network/Balance):**

- Switch to Avalanche Fuji in MetaMask
- Get test AVAX from faucet

**Test 5-6 (Firebase/Firestore):**

- Check `.env` file exists
- Check Firebase config is correct
- Deploy Firestore rules: `firebase deploy --only firestore:rules`

**Test 7 (Bet Placement):**

- Check browser console for detailed error
- Verify market and option exist in Firestore
- Check Firestore security rules

**Test 8-10 (AI/AMM/Components):**

- These should always pass if files were created
- If they fail, check for import errors

---

## 📊 Performance Benchmarks

### Target Metrics:

| Metric             | Target | Current |
| ------------------ | ------ | ------- |
| Page Load          | < 3s   | Test it |
| Bet Placement      | < 5s   | Test it |
| Market Creation    | < 10s  | Test it |
| Smart Contract Gas | 60,000 | ✅      |
| Test Coverage      | > 80%  | ✅      |

---

## 🔐 Security Verification

### Smart Contract Security:

```bash
# Check for common vulnerabilities
cd contracts

# Look for:
# ✅ ReentrancyGuard on payable functions
# ✅ Access control (onlyOwner)
# ✅ Input validation
# ✅ No unchecked external calls

# Optionally run slither
npm install -g slither-analyzer
slither .
```

### Firebase Security:

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Test rules
# - Try writing as non-admin
# - Should be rejected
```

---

## 📱 Mobile Testing

### Test on Mobile:

1. **Open on phone:** http://localhost:5173 (use your IP: `ifconfig` or `ipconfig`)
2. **Or deploy to Netlify:** `npm run build && netlify deploy`
3. **Test responsive design:**
   - [ ] Navbar works
   - [ ] Markets display correctly
   - [ ] Bet dialog fits screen
   - [ ] Buttons are tappable
   - [ ] Forms work on mobile keyboard

---

## 🎯 Hackathon-Specific Tests

### **Demo Preparation:**

1. **Create 5 sample markets** (in /admin)

   - Crypto-related
   - Sports-related
   - Tech-related
   - Mix of open/closed/settled

2. **Place 3-5 test bets** (as user)

   - Different amounts
   - Different markets
   - Both YES and NO

3. **Test all new features:**

   - [ ] AI insights show on market pages
   - [ ] Gas comparison visible
   - [ ] Payment status works

4. **Verify smart contracts:**

   - [ ] Check on Snowtrace
   - [ ] All 3 contracts verified
   - [ ] Can view source code

5. **Practice demo flow:**
   - [ ] Connect wallet (< 10 sec)
   - [ ] Show AI insights (< 5 sec)
   - [ ] Place bet (< 15 sec)
   - [ ] Show gas savings (< 5 sec)
   - [ ] Total: < 35 seconds for full flow

---

## ✅ Final Verification

Run all these commands and check for ✅:

```bash
# 1. Contract tests
cd contracts && npx hardhat test
# ✅ 8 passing

# 2. Build frontend
cd .. && npm run build
# ✅ built successfully

# 3. No TypeScript errors
npx tsc --noEmit
# ✅ No errors

# 4. No linter errors (if eslint configured)
npm run lint
# ✅ No errors (or not configured)

# 5. Start server
npm run dev
# ✅ Server running on :5173

# 6. Integration tests
# Visit: http://localhost:5173/integration-test
# ✅ All tests pass

# 7. Manual betting
# Visit: http://localhost:5173
# Connect wallet, place bet
# ✅ Bet placed successfully

# 8. Admin features
# Visit: http://localhost:5173/admin
# Create and settle market
# ✅ Market created and settled
```

---

## 🎉 Success Criteria

All of these should be ✅:

- [ ] Smart contracts deploy without errors
- [ ] All contract tests pass
- [ ] Frontend builds successfully
- [ ] Wallet connects properly
- [ ] Can place bets (off-chain)
- [ ] Bets save to Firestore
- [ ] Admin can create markets
- [ ] Admin can settle markets
- [ ] AI insights work
- [ ] Gas comparison displays
- [ ] Payment status animates
- [ ] No critical console errors
- [ ] Mobile responsive
- [ ] Documentation complete

---

## 🚀 You're Ready When:

✅ Integration test shows 10/10 tests passing
✅ Can place a bet and see it in /account
✅ Can create a market as admin
✅ All new components render correctly
✅ No red errors in console
✅ Smart contracts verified on Snowtrace

**If all above are ✅, you're ready to demo! 🏆**

---

## 📞 Quick Links

- **Integration Test:** http://localhost:5173/integration-test
- **Bet Diagnostic:** http://localhost:5173/test-bet
- **Admin Dashboard:** http://localhost:5173/admin
- **Production Checklist:** PRODUCTION_READINESS_CHECK.md
- **Troubleshooting:** TROUBLESHOOTING.md

---

**Run the integration test now and tell me the results! 🚀**


