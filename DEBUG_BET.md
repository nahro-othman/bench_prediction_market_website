# 🔍 Debug Bet Placement - Step by Step

## If "nothing happens" when placing a bet, follow these steps:

### Step 1: Open Browser Console

1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click the **Console** tab
3. Clear any existing logs (click 🚫 icon)

---

### Step 2: Check if you're on the right page

Run this in console:

```javascript
console.log("Current URL:", window.location.href);
console.log("Should be on: http://localhost:5173/markets/[some-id]");
```

**Expected:** You should be on a market detail page, not the homepage.

---

### Step 3: Check if wallet is connected

Run this in console:

```javascript
// Check wallet connection
console.log("Wallet store:", window.__SVELTE__ || "Not available");

// Try to access wallet directly
if (typeof window.ethereum !== "undefined") {
  console.log("✅ MetaMask detected");
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  console.log("Connected accounts:", accounts);
  if (accounts.length > 0) {
    console.log("✅ Wallet connected:", accounts[0]);
  } else {
    console.log('❌ No wallet connected - click "Connect Wallet"');
  }
} else {
  console.log("❌ MetaMask not installed");
}
```

**Expected:** Should show "✅ Wallet connected: 0x..."

---

### Step 4: Check if markets exist in Firestore

Run this in console (copy and paste all at once):

```javascript
// Import Firebase
import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js").then(
  async ({ initializeApp }) => {
    const { getFirestore, collection, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
    );

    // Get your Firebase config from .env
    console.log("Checking Firestore...");

    // Try to list markets
    try {
      const db = getFirestore();
      const marketsSnap = await getDocs(collection(db, "markets"));
      console.log(`✅ Found ${marketsSnap.size} markets in Firestore`);

      marketsSnap.forEach((doc) => {
        console.log("Market:", doc.id, doc.data().title);
      });

      if (marketsSnap.size === 0) {
        console.log("❌ No markets found! Create one first.");
      }
    } catch (error) {
      console.error("❌ Firebase error:", error.message);
    }
  }
);
```

**Expected:** Should show "✅ Found X markets"

---

### Step 5: Test button click manually

Run this in console:

```javascript
// Find the YES/NO buttons
const yesButtons = document.querySelectorAll("button:not([disabled])");
console.log(`Found ${yesButtons.length} enabled buttons on page`);

// List all buttons
yesButtons.forEach((btn, i) => {
  console.log(`Button ${i}:`, btn.textContent.trim());
});

// If you see YES/NO buttons, try clicking one programmatically
console.log("Try clicking a button manually, then check console for logs");
```

**Expected:** Should see "YES" and "NO" buttons listed

---

### Step 6: Test the bet function directly

If buttons don't work, test the bet function directly:

```javascript
// Manually trigger bet placement
console.log("Testing bet placement...");

// You'll need to replace these with actual IDs from your Firestore
const testBet = {
  marketId: "YOUR_MARKET_ID", // Get from URL or console
  optionId: "YOUR_OPTION_ID", // Get from Firestore
  side: "yes",
  stake: 0.01,
};

console.log("Test bet:", testBet);
console.log('Open the bet dialog and click "Place bet" button');
console.log("Watch console for logs starting with 🎲, 📝, etc.");
```

---

### Step 7: Check for JavaScript errors

Look in the console for **RED ERROR MESSAGES**. Common errors:

❌ **"Cannot read property of undefined"**

- Something isn't loaded yet

❌ **"Firebase: Firebase App named '[DEFAULT]' already exists"**

- Page loaded twice, refresh

❌ **"Missing or insufficient permissions"**

- Firestore rules are blocking writes

❌ **"Network error"**

- No internet or Firebase down

---

## 🎯 What You Should See When It Works

When you click YES or NO, the console should show:

```
🎲 Attempting to place bet: {marketId, optionId, side, stake}
🎲 Placing bet...
📝 Starting fallback bet placement...
🔗 Wallet connected: 0x742d...
💾 Firebase initialized
📊 Fetching market and option data...
✅ Market and option data loaded {market: "...", option: "..."}
💰 AVAX balance: 1.2345 Stake: 0.01
👤 Checking user profile...
✅ User profile exists
📝 Creating position...
✅ Position created with ID: abc123xyz
📊 Updating option volume...
✅ Option volume updated
🎉 Bet placed successfully! (AVAX amount: 0.01)
✅ Bet placed successfully!
📊 Bet result: {success: true, positionId: "abc123", message: "..."}
```

---

## 🚨 Common "Nothing Happens" Causes

### 1. **Button click isn't registered**

**Check:** Do you see the bet dialog open?
**Fix:** Make sure you're clicking YES or NO, not somewhere else

### 2. **Wallet not connected**

**Check:** Do you see wallet address in navbar?
**Fix:** Click "Connect Wallet" in navbar

### 3. **JavaScript error**

**Check:** Any red errors in console?
**Fix:** Read the error message, it tells you what's wrong

### 4. **Market doesn't exist**

**Check:** Run Step 4 to list markets
**Fix:** Create a market in Firebase Console or admin page

### 5. **No AVAX balance**

**Check:** Do you have at least 0.01 AVAX?
**Fix:** Get test AVAX from https://faucet.avax.network/

### 6. **Firestore rules blocking writes**

**Check:** Console says "Missing or insufficient permissions"
**Fix:** See TROUBLESHOOTING.md Step 5

---

## 🔧 Quick Fixes

### Fix 1: Hard Refresh

```bash
# Clear cache and reload
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)
```

### Fix 2: Reconnect Wallet

1. Open MetaMask
2. Click the three dots
3. Click "Disconnect this site"
4. Refresh page
5. Click "Connect Wallet" again

### Fix 3: Clear Browser Data

1. F12 → Application tab
2. Storage → Clear site data
3. Refresh page

### Fix 4: Check .env file exists

```bash
ls -la /Users/nahro/Documents/my_projects/bench_prediction_market_website/.env
```

If it doesn't exist, create it with Firebase config!

---

## 📞 Still Nothing?

### Take a screenshot of:

1. Your browser console (F12 → Console)
2. The Network tab (F12 → Network, filter by "firestore")
3. The page URL

### Then check:

- Is `npm run dev` still running?
- Are you on `http://localhost:5173`?
- Did you create any markets in Firebase?
- Is your `.env` file correct?

---

## ✅ Success Checklist

When it works, you'll see:

- [ ] Bet dialog opens when you click YES/NO
- [ ] Can enter a stake amount
- [ ] "Place bet" button is enabled (not greyed out)
- [ ] Clicking "Place bet" shows spinner
- [ ] Console shows all the 🎲📝✅ logs
- [ ] Green success notification appears
- [ ] Dialog closes automatically
- [ ] Position appears in Firebase Console → positions collection

---

**Run the steps above and tell me what you see! The console logs will tell us exactly what's wrong. 🔍**


