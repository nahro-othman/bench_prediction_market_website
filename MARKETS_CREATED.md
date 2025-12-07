# 🎊 NEW MARKETS CREATED ON BLOCKCHAIN!

## ✅ **6 Markets Deployed Successfully!**

All markets are now live on Avalanche Fuji testnet!

---

## 📋 **Market List:**

### Market 0: Will Bitcoin hit $100k in 2025?

- **ID:** `0`
- **Options:** Yes, No
- **Sport:** Crypto
- **TX:** [0x9007...](https://testnet.snowtrace.io/tx/0x90075d1ad1a30fbf0bd0ec9726a105a5c4cf28c685f837c4a4edde21739f63a4)

### Market 1: Will Bitcoin hit $100k in 2025?

- **ID:** `1`
- **Options:** Yes, No
- **Sport:** Crypto
- **TX:** [0xce45...](https://testnet.snowtrace.io/tx/0xce45c73e33c13f60b00cd8582ffcc98e206fac3c9b0edd834d671f8a900d1bae)

### Market 2: Champions League Winner 2024/25

- **ID:** `2`
- **Options:** Real Madrid, Man City, Bayern, Other
- **Sport:** Football
- **TX:** [0x2a37...](https://testnet.snowtrace.io/tx/0x2a37686daafa58556426455ad7f0a2784787a909a75d57dea4d4f57bc5a233ad)

### Market 3: Will Mbappé score 30+ La Liga goals?

- **ID:** `3`
- **Options:** Yes, No
- **Sport:** Football
- **TX:** [0xec4b...](https://testnet.snowtrace.io/tx/0xec4badd833c98b8517e476c895f1cab036b5731a7efba4b4e572a24bc3c1ee67)

### Market 4: World Cup 2026 Winner

- **ID:** `4`
- **Options:** Brazil, France, Argentina, Other
- **Sport:** Football
- **TX:** [0x9191...](https://testnet.snowtrace.io/tx/0x919141057903728f156b15367f8f9482fe222907626f17b5c9305b18a5b1deed)

### Market 5: Will Ethereum reach $5,000 in 2025?

- **ID:** `5`
- **Options:** Yes, No
- **Sport:** Crypto
- **TX:** [0x1b0f...](https://testnet.snowtrace.io/tx/0x1b0f56e44603a3eb9f62177e1c0b17a9ee8dc16e5e3868bd13e6723fc242a118)

---

## 🚀 **NEXT STEPS:**

### I need to sync these to Firestore manually:

The issue is that Firestore document IDs need to match blockchain IDs (`0`, `1`, `2`, etc.), but Firebase REST API doesn't allow anonymous writes.

**Two options:**

### **Option A: Quick Manual Setup (5 minutes)**

Go to Firebase Console → Firestore:

For each market above, create:

1. Document in `markets` collection with Document ID = Market ID
2. Fields: title, description, sport, status="open", etc.
3. Subcollection `options` with option documents

### **Option B: I create them via script (Need service account)**

You can download service account key from:
Firebase Console → Project Settings → Service Accounts → Generate New Private Key

Then save as `service-account-key.json` and run:

```bash
node scripts/sync-markets-to-firestore.js
```

---

## 💡 **OR Test Without Firestore Sync:**

You can test betting RIGHT NOW without Firestore!

Just open browser console and run:

```javascript
// Import service
const { placeBet } = await import("/src/lib/services/bets/index.ts");

// Bet on market 1, option 0 (Yes), 0.01 AVAX
const result = await placeBet("1", "0", "yes", 0.01);
console.log(result);
```

**MetaMask will popup!** 🦊

---

## 🎯 **Test URLs:**

Even without Firestore, you can navigate to:

- http://localhost:5173/markets/0
- http://localhost:5173/markets/1
- http://localhost:5173/markets/2
- http://localhost:5173/markets/3
- http://localhost:5173/markets/4
- http://localhost:5173/markets/5

And try betting from console!

---

**Which option would you like to do?**

1. I can guide you through manual Firestore setup
2. You can download service account key and I'll run the script
3. Or just test betting via console right now!
