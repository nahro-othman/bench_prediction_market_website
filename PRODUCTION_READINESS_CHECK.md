# ✅ Production Readiness Checklist

## Complete verification checklist for Bench Prediction Market

---

## 🔗 Smart Contracts (On-Chain)

### Deployment Status

- [ ] Contracts compiled successfully
- [ ] Tests passing (run `cd contracts && npx hardhat test`)
- [ ] Deployed to Fuji testnet
- [ ] Contract addresses saved to `.env`
- [ ] Contracts verified on Snowtrace
- [ ] Gas optimizations enabled

### Contract Functionality

- [ ] X402Payment can initiate payments
- [ ] X402Payment streams payments correctly
- [ ] ERC8004Token can do conditional transfers
- [ ] ERC8004Token can do time-locked transfers
- [ ] PredictionMarket can create markets
- [ ] PredictionMarket can place bets
- [ ] PredictionMarket can settle markets
- [ ] Only owner can settle markets

### Test Smart Contracts

```bash
cd contracts
npm install
npx hardhat test
```

**Expected:** All tests should pass ✅

---

## 💻 Frontend (Off-Chain)

### Firebase Setup

- [ ] `.env` file exists with Firebase config
- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Firestore security rules deployed
- [ ] Cloud Functions deployed (optional)
- [ ] Firebase initialized correctly

### Test Firebase Connection

```bash
# In browser console at http://localhost:5173
import { getFirebaseFirestore } from '$lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const db = getFirebaseFirestore();
const snap = await getDocs(collection(db, 'markets'));
console.log('Markets found:', snap.size);
```

**Expected:** Should show markets count without errors

---

## 🦊 Wallet Integration

### MetaMask Connection

- [ ] MetaMask detects properly
- [ ] Wallet connects on click
- [ ] Auto-switches to Avalanche Fuji
- [ ] Wallet address shows in navbar
- [ ] AVAX balance displays
- [ ] Network check works
- [ ] Disconnection works

### Test Wallet Flow

1. Go to http://localhost:5173
2. Click "Connect Wallet"
3. Approve in MetaMask
4. Should see address and balance

**Expected:** Wallet connects, shows address like `0x742d...A8F3`

---

## 🎲 Betting Flow (Critical!)

### Place Bet (Off-Chain)

- [ ] Can click YES/NO buttons
- [ ] Bet dialog opens
- [ ] Can enter stake amount
- [ ] Quick stake buttons work
- [ ] Validation shows errors
- [ ] Submit button works
- [ ] Loading state shows
- [ ] Success notification appears
- [ ] Position saved to Firestore
- [ ] Option volumes update

### Test Betting

1. Go to http://localhost:5173/test-bet
2. Click "Run Diagnostic Tests"
3. Check all tests pass
4. Go to a market page
5. Click YES or NO
6. Enter 0.01 AVAX
7. Click "Place bet"
8. Check browser console for logs

**Expected:** See ✅ success logs and green notification

---

## 👨‍💼 Admin Features

### Admin Access

- [ ] Wallet connects
- [ ] Can access /admin page
- [ ] Shows admin dashboard
- [ ] Create market form works
- [ ] Can create new market
- [ ] Markets list shows all markets
- [ ] Can close markets
- [ ] Can settle markets

### Test Admin Flow

1. Connect wallet at /login
2. Go to /admin
3. Click "+ Create Market"
4. Fill in form
5. Click "Create Market"
6. Market appears in list
7. Close market (if open)
8. Settle market (select winner)

**Expected:** Market created, closed, and settled successfully

---

## 🆕 New Features

### AI Insights Component

- [ ] Loads on market pages
- [ ] Shows confidence score
- [ ] Shows risk level
- [ ] Shows prediction
- [ ] Shows reasoning
- [ ] Suggests stake amount

### Gas Comparison Component

- [ ] Shows traditional vs x402 costs
- [ ] Calculates gas correctly
- [ ] Shows percentage savings
- [ ] Shows USD costs
- [ ] Expandable details work

### Payment Status Modal

- [ ] Opens when betting
- [ ] Shows progress bar
- [ ] Shows step-by-step progress
- [ ] Auto-closes on success
- [ ] Shows error on failure

### AMM Utilities

- [ ] Can calculate probabilities
- [ ] Can calculate price impact
- [ ] Can execute bets
- [ ] Can get odds

---

## 🧪 Integration Tests

### Run All Tests

```bash
# 1. Test smart contracts
cd contracts
npx hardhat test

# 2. Test frontend dev server
cd ..
npm run dev

# 3. Open test page
open http://localhost:5173/test-bet

# 4. Run diagnostic tests
# Click "Run Diagnostic Tests" button

# 5. Test market page
open http://localhost:5173/markets/[market-id]

# 6. Test admin page
open http://localhost:5173/admin
```

---

## 📱 Browser Testing

### Desktop

- [ ] Chrome - works ✅
- [ ] Firefox - works ✅
- [ ] Safari - works ✅
- [ ] Edge - works ✅

### Mobile

- [ ] iPhone Safari - responsive ✅
- [ ] Android Chrome - responsive ✅
- [ ] MetaMask mobile app - works ✅

---

## 🔐 Security Checks

### Smart Contracts

- [ ] ReentrancyGuard on payable functions
- [ ] Ownable for admin functions
- [ ] Input validation on all functions
- [ ] No unchecked external calls
- [ ] Proper access control

### Firestore Security

- [ ] Rules deployed
- [ ] Read access controlled
- [ ] Write access controlled
- [ ] Admin operations protected
- [ ] Position writes validated

### Frontend Security

- [ ] No private keys in code
- [ ] Environment variables used
- [ ] No sensitive data exposed
- [ ] HTTPS in production
- [ ] CORS configured properly

---

## 📊 Performance

### Page Load Times

- [ ] Home page < 3 seconds
- [ ] Market page < 2 seconds
- [ ] Admin page < 2 seconds
- [ ] Images optimized
- [ ] Code split properly

### Transaction Speed

- [ ] Bet placement < 5 seconds
- [ ] Market creation < 10 seconds
- [ ] Market settlement < 10 seconds
- [ ] Real-time updates work

---

## 🌐 Network Configuration

### Environment Variables

```env
# Firebase
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...

# Avalanche
PUBLIC_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PUBLIC_CHAIN_ID=43113

# Smart Contracts (after deployment)
PUBLIC_TOKEN_CONTRACT=0x...
PUBLIC_X402_CONTRACT=0x...
PUBLIC_PREDICTION_MARKET_CONTRACT=0x...
```

### Network Settings

- [ ] RPC URL correct
- [ ] Chain ID correct (43113 for Fuji)
- [ ] Gas price appropriate
- [ ] Contract addresses correct

---

## 🐛 Error Handling

### Common Errors Handled

- [ ] Wallet not installed
- [ ] Wallet not connected
- [ ] Wrong network
- [ ] Insufficient balance
- [ ] Transaction rejected
- [ ] Network errors
- [ ] Firebase errors
- [ ] Contract errors

### User Feedback

- [ ] Clear error messages
- [ ] Success notifications
- [ ] Loading states
- [ ] Helpful tooltips
- [ ] Console logs for debugging

---

## 📚 Documentation

### User Documentation

- [ ] README.md complete
- [ ] QUICKSTART.md up to date
- [ ] TROUBLESHOOTING.md comprehensive
- [ ] ADMIN_SETUP.md clear
- [ ] DEMO_SCRIPT.md ready

### Developer Documentation

- [ ] Code comments clear
- [ ] Contract documentation (NatSpec)
- [ ] API documentation
- [ ] Type definitions complete
- [ ] Architecture diagrams

---

## 🚀 Deployment Checklist

### Pre-Deploy

- [ ] All tests passing
- [ ] No console errors
- [ ] No linter errors
- [ ] Build succeeds
- [ ] Environment variables set

### Deploy Smart Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.js --network fuji
# Copy contract addresses to .env
```

### Deploy Frontend

```bash
npm run build
# Deploy to Netlify/Vercel
```

### Deploy Firebase

```bash
firebase deploy --only firestore:rules
firebase deploy --only functions  # if using Cloud Functions
```

### Post-Deploy

- [ ] Contracts verified on Snowtrace
- [ ] Frontend accessible
- [ ] Can connect wallet
- [ ] Can place bets
- [ ] Can create markets
- [ ] Monitor for errors

---

## ✅ Final Checks

### Smoke Test

1. [ ] Visit production URL
2. [ ] Connect MetaMask
3. [ ] View a market
4. [ ] Place a test bet (small amount)
5. [ ] Create a test market (as admin)
6. [ ] Settle the market
7. [ ] Check payout received

### Monitor

- [ ] Check Firebase logs
- [ ] Check Snowtrace for transactions
- [ ] Check browser console for errors
- [ ] Monitor gas costs
- [ ] Monitor user feedback

---

## 🎉 Success Criteria

All of the following should be true:

✅ **Smart contracts deployed and verified**
✅ **Frontend deployed and accessible**
✅ **Wallet connection works**
✅ **Bets can be placed successfully**
✅ **Markets can be created/settled**
✅ **All new features working (AI, Gas comparison, Payment status)**
✅ **No critical errors in console**
✅ **Mobile responsive**
✅ **Documentation complete**

---

## 🚨 Blockers

If any of these are true, **DO NOT deploy to production**:

❌ Smart contract tests failing
❌ Can't connect wallet
❌ Can't place bets
❌ Firebase not configured
❌ Security vulnerabilities found
❌ Critical bugs present

---

## 📞 Support Resources

- **Troubleshooting**: See `TROUBLESHOOTING.md`
- **Admin Setup**: See `ADMIN_SETUP.md`
- **Bet Issues**: See `DEBUG_BET.md`
- **Demo**: See `DEMO_SCRIPT.md`

---

## 🎯 Quick Test Script

Run this to test everything quickly:

```bash
# 1. Test contracts
cd contracts && npx hardhat test && cd ..

# 2. Start dev server
npm run dev &

# 3. Wait for server to start
sleep 5

# 4. Open test pages
open http://localhost:5173/test-bet
open http://localhost:5173/admin
open http://localhost:5173

# 5. Test wallet connection
# - Connect MetaMask
# - Check balance shows
# - Check network is Fuji

# 6. Test betting
# - Go to a market
# - Click YES/NO
# - Place bet
# - Check success

# 7. Test admin
# - Go to /admin
# - Create market
# - Settle market
# - Check works
```

---

**When all checkboxes are ✅, you're ready for production! 🚀**


