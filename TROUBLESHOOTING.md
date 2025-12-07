# 🔧 Troubleshooting Guide - Bet Placement Issues

## When bets aren't working, follow this checklist:

### ✅ Step 1: Check Browser Console

Open your browser's developer tools (F12) and look at the Console tab. You should see detailed logs when placing a bet:

```
🎲 Placing bet...
📝 Starting fallback bet placement...
🔗 Wallet connected: 0x...
💾 Firebase initialized
📊 Fetching market and option data...
✅ Market and option data loaded
💰 AVAX balance: X.XXXX Stake: X.XXXX
👤 Checking user profile...
✅ User profile exists
📝 Creating position...
✅ Position created with ID: abc123
📊 Updating option volume...
✅ Option volume updated
🎉 Bet placed successfully!
```

If you see any ❌ errors, read the error message carefully - it will tell you what's wrong!

---

### ✅ Step 2: Check Wallet Connection

1. **Is MetaMask connected?**

   - Look for your wallet address in the navbar
   - It should show something like "0x742d...A8F3"

2. **Are you on the right network?**

   - Should be "Avalanche Fuji C-Chain" (testnet)
   - Chain ID: 43113

3. **Do you have test AVAX?**
   - Check your wallet balance
   - Need at least 0.01 AVAX for a bet
   - Get free test AVAX: https://faucet.avax.network/

**Fix:** If wallet isn't connected, click "Connect Wallet" in the navbar.

---

### ✅ Step 3: Check Firebase Configuration

1. **Do you have a `.env` file?**

   - Location: `/Users/nahro/Documents/my_projects/bench_prediction_market_website/.env`
   - Should contain Firebase config variables

2. **Example `.env` file:**

```env
PUBLIC_FIREBASE_API_KEY=AIza...
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Fix:** Create `.env` file with your Firebase credentials.

---

### ✅ Step 4: Check Firestore Data

Your Firestore database should have:

1. **Markets collection:**

   - At least one market document
   - Each market has an `options` subcollection

2. **Required market fields:**

```javascript
{
  id: "market-123",
  title: "Market title",
  status: "open",
  closeAt: Timestamp,
  createdAt: Timestamp,
  sport: "sports" // or any category
}
```

3. **Required option fields:**

```javascript
{
  id: "option-123",
  label: "Option A",
  probability: 0.5,
  yesVolume: 0,
  noVolume: 0,
  order: 0
}
```

**Fix:** Create sample markets using Firebase Console or the admin page.

---

### ✅ Step 5: Check Firestore Security Rules

Your `firestore.rules` should allow reads and writes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads for all authenticated users
    match /{document=**} {
      allow read: if request.auth != null || true; // Allow anonymous reads during development
    }

    // Allow writes to positions for authenticated users
    match /positions/{position} {
      allow write: if request.auth != null || true; // Allow during development
    }

    // Allow writes to users for authenticated users
    match /users/{userId} {
      allow write: if request.auth != null || true;
    }

    // Allow option updates
    match /markets/{marketId}/options/{optionId} {
      allow write: if true; // Allow during development
    }
  }
}
```

**Fix:** Update Firestore rules in Firebase Console, then deploy:

```bash
firebase deploy --only firestore:rules
```

---

### ✅ Step 6: Check Network Tab

Open DevTools → Network tab and filter by "Firestore" or "googleapis.com":

- ✅ Should see requests to `firestore.googleapis.com`
- ✅ Should get 200 OK responses
- ❌ If you see 401/403 errors → Firebase auth issue
- ❌ If you see 404 errors → Document not found

---

## 🔍 Common Error Messages

### "Wallet not connected"

**Fix:**

1. Install MetaMask
2. Click "Connect Wallet"
3. Approve the connection

### "Please switch to Avalanche Fuji network"

**Fix:**

1. Open MetaMask
2. Click network dropdown
3. Select "Avalanche Fuji C-Chain"
4. Or click "Switch Network" when prompted

### "Insufficient AVAX balance"

**Fix:**

1. Get test AVAX: https://faucet.avax.network/
2. Enter your wallet address
3. Click "Request 2 AVAX"
4. Wait ~30 seconds

### "Market or option not found"

**Fix:**

1. Check Firestore Console
2. Verify market exists with correct ID
3. Verify option exists in market's subcollection

### "Failed to place bet: Missing or insufficient permissions"

**Fix:**

1. Update Firestore security rules (see Step 5)
2. Deploy rules: `firebase deploy --only firestore:rules`

---

## 🧪 Quick Test

Run this in your browser console to test Firebase connection:

```javascript
// Test Firebase
import { getFirebaseFirestore } from "$lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const db = getFirebaseFirestore();
const marketsSnap = await getDocs(collection(db, "markets"));
console.log("Markets found:", marketsSnap.size);
```

If this works, Firebase is configured correctly!

---

## 📞 Still Having Issues?

### Check These Files:

1. **`src/lib/firebase.ts`** - Firebase initialization
2. **`src/lib/services/bets/index.ts`** - Bet placement logic
3. **`src/routes/markets/[id]/+page.svelte`** - Market detail page
4. **`firestore.rules`** - Security rules

### Enable Extra Debugging:

Add this to your browser console:

```javascript
// Enable verbose logging
localStorage.setItem("debug", "*");
location.reload();
```

### Create a Test Market:

Use Firebase Console to manually create a market:

1. Go to Firestore Database
2. Create collection: `markets`
3. Add document with auto ID:

```json
{
  "title": "Test Market",
  "status": "open",
  "closeAt": [future timestamp],
  "createdAt": [now timestamp],
  "sport": "test"
}
```

4. In that document, create subcollection: `options`
5. Add option document:

```json
{
  "label": "Option A",
  "probability": 0.5,
  "yesVolume": 0,
  "noVolume": 0,
  "order": 0
}
```

Now try betting on that market!

---

## ✅ Success Checklist

When everything works, you should see:

- [ ] Wallet address in navbar
- [ ] AVAX balance displayed
- [ ] Markets loading on homepage
- [ ] Can click YES/NO buttons
- [ ] Bet dialog opens
- [ ] Can enter stake amount
- [ ] Click "Place bet" button
- [ ] See "Placing bet..." spinner
- [ ] See success alert: "✅ Bet placed successfully!"
- [ ] See success notification in bottom right
- [ ] Console shows all ✅ checkmarks
- [ ] Position appears in `/account` page

---

## 🚨 Emergency Reset

If nothing works, try a fresh start:

```bash
# 1. Clear browser data
# - Open DevTools → Application → Clear Storage → Clear site data

# 2. Restart dev server
npm run dev

# 3. Reconnect wallet
# - Refresh page
# - Click "Connect Wallet"
# - Approve connection

# 4. Try placing a bet
# - Go to a market
# - Click YES or NO
# - Enter 0.01 AVAX
# - Submit
```

---

## 📖 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Avalanche Faucet](https://faucet.avax.network/)
- [MetaMask Support](https://support.metamask.io/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**If you're still stuck, check the browser console - it now has detailed logging at every step! 🔍**


