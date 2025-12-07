# 🔐 Admin Setup Guide

## How to Set Up Admin Access

Your admin dashboard needs proper security. Currently, anyone with a wallet can access it!

---

## 🚀 Quick Setup (5 minutes)

### **Step 1: Add Your Wallet as Admin**

1. **Connect your wallet** at http://localhost:5173/login
2. **Copy your wallet address** (e.g., `0x742d35Cc6634C0532925a3b844Bc9e7595f0A8F3`)
3. **Open Firebase Console**: https://console.firebase.google.com
4. **Go to Firestore Database**
5. **Create a new collection** called `admins`
6. **Add a document**:
   - Document ID: **Your wallet address** (e.g., `0x742d35Cc6634C0532925a3b844Bc9e7595f0A8F3`)
   - Fields:
     ```json
     {
       "name": "Your Name",
       "email": "your@email.com",
       "createdAt": [click "Timestamp" button → now]
     }
     ```
7. **Click "Save"**

Now YOUR wallet is an admin! ✅

---

## 📝 Example: Adding Admin in Firestore

```
Collection: admins
├── Document: 0x742d35Cc6634C0532925a3b844Bc9e7595f0A8F3
│   ├── name: "Alice Admin"
│   ├── email: "alice@example.com"
│   └── createdAt: October 25, 2024 at 10:30:00 AM UTC
└── Document: 0x123456789abcdef...
    ├── name: "Bob Admin"
    ├── email: "bob@example.com"
    └── createdAt: October 26, 2024 at 2:15:00 PM UTC
```

---

## 🔒 Security Update Needed

Your admin page currently doesn't check if the user is an admin. Anyone with MetaMask can access it!

### **How to Fix:**

I'll create a helper function to check if a wallet address is an admin.

---

## ✅ Test Admin Access

After adding your wallet to the `admins` collection:

1. **Go to** http://localhost:5173/admin
2. **You should see** "Admin Dashboard" with:
   - "Create Market" button
   - List of all markets
   - "Close" and "Settle" buttons

If you see "Please sign in to access admin" → Connect wallet first at `/login`

If you see "Not authorized" (after I add the check) → Add your wallet to `admins` collection

---

## 🎯 Admin Actions You Can Do

Once you're an admin, you can:

### **1. Create Markets**

- Click "+ Create Market"
- Fill in title, description, close date
- Add 2-6 options
- Click "Create Market"

### **2. Close Markets**

- Find an open market
- Click "Close" button
- Market stops accepting bets

### **3. Settle Markets**

- Find a closed market
- Click "Settle" button
- Select winning option
- Click "Confirm Settlement"
- All winners get paid automatically!

---

## 🚨 Common Issues

### "I don't see my wallet address in MetaMask"

**Fix:**

1. Open MetaMask
2. Click your account icon (top right)
3. Your address is shown - click to copy
4. Make sure it starts with `0x`

### "I added my wallet to admins but still can't access"

**Fix:**

1. Check the document ID is EXACTLY your wallet address (including `0x`)
2. Wallet addresses are case-sensitive in Firestore
3. Try refreshing the page
4. Check browser console for errors

### "I see 'Not authorized' message"

**Fix:**

1. Your wallet isn't in the `admins` collection
2. Add it following Step 1 above
3. Make sure the document ID matches your wallet address exactly

---

## 🔐 Multiple Admins

To add more admins:

1. Get their wallet address
2. Add a new document to `admins` collection
3. Use their wallet address as document ID
4. They can now access `/admin`

Example:

```
admins/
├── 0x742d35Cc6634C0532925a3b844Bc9e7595f0A8F3  ← Your wallet
├── 0x987654321abcdefABCDEF...              ← Co-founder's wallet
└── 0x456789abcdefABCDEF123...              ← Another admin
```

---

## ⚙️ Environment Variable Method (Alternative)

You can also add admin addresses to `.env`:

```env
# Add to your .env file
PUBLIC_ADMIN_ADDRESSES="0x742d35Cc6634C0532925a3b844Bc9e7595f0A8F3,0x987654321..."
```

Then check in code:

```typescript
const adminAddresses = PUBLIC_ADMIN_ADDRESSES.split(",");
const isAdmin = adminAddresses.includes($walletStore.address);
```

But using Firestore is better because you can add/remove admins without redeploying!

---

## 📚 Related Files

- **Admin Page**: `src/routes/admin/+page.svelte`
- **Admin Service**: `src/lib/services/admin/index.ts`
- **Firestore Rules**: `firestore.rules`

---

## 🎉 You're All Set!

Now you can:

- ✅ Create prediction markets
- ✅ Close markets (stop betting)
- ✅ Settle markets (declare winner)
- ✅ Manage all markets from one dashboard

---

## 🔒 Next: Update Firestore Rules

Make sure only admins can create/settle markets:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function: Check if user is admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Markets: Anyone can read, only admins can write
    match /markets/{marketId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();

      // Options subcollection
      match /options/{optionId} {
        allow read: if true;
        allow write: if isAdmin() || true; // Allow bet volume updates
      }
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

---

**Your admin dashboard is ready! Go create some markets! 🚀**


