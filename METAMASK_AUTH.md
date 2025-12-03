# MetaMask Authentication Implementation ✅

## Overview

Successfully migrated from Firebase Email/Password authentication to **MetaMask-only** wallet authentication for the Avalanche hackathon submission. This makes Bench a truly crypto-native prediction market.

## What Was Implemented

### 1. Web3 Authentication Service

**File**: `src/lib/services/web3/auth.ts`

Features:

- ✅ MetaMask detection and connection
- ✅ Avalanche network switching (Fuji Testnet)
- ✅ Auto-add Avalanche network to MetaMask
- ✅ Wallet balance tracking (AVAX)
- ✅ Account change listeners
- ✅ Network change listeners
- ✅ Auto-reconnect on page load
- ✅ User profile creation in Firestore

### 2. Wallet Connect Component

**File**: `src/lib/components/auth/WalletConnect.svelte`

Features:

- ✅ Beautiful MetaMask connection UI
- ✅ Install MetaMask detection & link
- ✅ Network switching to Avalanche Fuji
- ✅ Error handling with user-friendly messages
- ✅ Loading states
- ✅ Link to Avalanche Faucet for test AVAX
- ✅ Educational section explaining Web3 benefits

### 3. Updated Pages

#### Login Page (`src/routes/login/+page.svelte`)

- Removed: Firebase email/password form
- Added: MetaMask wallet connection

#### Signup Page (`src/routes/signup/+page.svelte`)

- Removed: Firebase email/password registration
- Added: MetaMask wallet connection (same as login)

### 4. Updated Navbar

**File**: `src/lib/components/layout/Navbar.svelte`

Features:

- ✅ Shows connected wallet address (truncated)
- ✅ Displays AVAX balance from wallet
- ✅ Shows Credits balance from Firestore
- ✅ Wallet dropdown menu with:
  - Full address display
  - Account page link
  - Admin page link
  - Disconnect button
- ✅ Mobile-responsive balances
- ✅ Auto-reconnect on page load

## Technical Details

### Network Configuration

**Current Network**: Avalanche Fuji Testnet

- Chain ID: 43113 (0xA869)
- RPC URL: https://api.avax-test.network/ext/bc/C/rpc
- Explorer: https://testnet.snowtrace.io/

**Production Network**: Avalanche Mainnet

- Chain ID: 43114 (0xA86A)
- RPC URL: https://api.avax.network/ext/bc/C/rpc
- Explorer: https://snowtrace.io/

### User Data Model

When a wallet connects, a user document is automatically created in Firestore:

```typescript
{
  walletAddress: string; // Primary key (document ID)
  balance: number; // Credits for betting (starts at 1000)
  createdAt: Timestamp; // When wallet first connected
  updatedAt: Timestamp; // Last connection time
  totalBets: number; // Total bets placed
  totalWinnings: number; // Total winnings earned
}
```

### Authentication Flow

1. **User clicks "Connect Wallet"**

   ```
   ├─ Check if MetaMask installed
   ├─ Request account access
   ├─ Check current network
   ├─ Switch to Avalanche if needed
   └─ Get wallet balance
   ```

2. **Create/Update User in Firestore**

   ```
   ├─ Use wallet address as document ID
   ├─ Create new user with starting balance (1000 credits)
   ├─ Or update existing user's last login
   └─ Save address to localStorage
   ```

3. **Store in Svelte Store**

   ```
   walletStore = {
     address: "0x1234...5678",
     balance: "1.2345",  // AVAX
     chainId: 43113,
     isConnected: true,
     isCorrectNetwork: true
   }
   ```

4. **Setup Event Listeners**
   ```
   ├─ accountsChanged: Reconnect on account switch
   ├─ chainChanged: Reload page on network change
   └─ Balance updates: Real-time from Firestore
   ```

## Dependencies Added

```json
{
  "ethers": "^6.x" // Web3 library for Ethereum/Avalanche interaction
}
```

Installed with: `npm install ethers@6 --legacy-peer-deps`

## Files Modified

### Created

- ✅ `src/lib/services/web3/auth.ts`
- ✅ `src/lib/components/auth/WalletConnect.svelte`
- ✅ `METAMASK_AUTH.md` (this file)

### Modified

- ✅ `src/routes/login/+page.svelte`
- ✅ `src/routes/signup/+page.svelte`
- ✅ `src/lib/components/layout/Navbar.svelte`
- ✅ `src/lib/components/index.ts`
- ✅ `package.json`

## How to Use

### For Users

1. **Install MetaMask**

   - Visit https://metamask.io/download/
   - Install browser extension
   - Create or import wallet

2. **Get Test AVAX**

   - Visit https://faucet.avax.network/
   - Enter your wallet address
   - Receive free test AVAX

3. **Connect to Bench**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - MetaMask will auto-switch to Avalanche Fuji
   - Start trading!

### For Developers

```typescript
// Import the service
import {
  connectWallet,
  disconnectWallet,
  walletStore,
} from "$lib/services/web3/auth";

// Connect wallet
await connectWallet();

// Access wallet info
$walletStore.address; // "0x1234..."
$walletStore.balance; // "1.2345"
$walletStore.isConnected; // true

// Disconnect
disconnectWallet();
```

## Future Enhancements

### Short Term

- [ ] Add WalletConnect for mobile wallets
- [ ] Add Coinbase Wallet support
- [ ] Add signature verification for extra security
- [ ] Implement session tokens

### Medium Term

- [ ] Add Core Wallet (Avalanche's native wallet)
- [ ] Implement message signing for authentication
- [ ] Add wallet connection analytics
- [ ] Support hardware wallets (Ledger, Trezor)

### Long Term

- [ ] Multi-chain support (Ethereum, BSC, Polygon)
- [ ] Social recovery options
- [ ] Gas-less transactions (meta-transactions)
- [ ] Account abstraction

## Security Considerations

1. **No Private Keys Stored**: Private keys stay in MetaMask
2. **No Server-Side Wallet**: All signing happens client-side
3. **User Consent**: Every transaction requires user approval
4. **Network Verification**: Always check correct network
5. **HTTPS Only**: Wallet connections only work over HTTPS in production

## Testing

### Test on Fuji Testnet

1. Switch MetaMask to Avalanche Fuji
2. Get test AVAX from faucet
3. Connect wallet to app
4. Verify:
   - ✅ Address displayed correctly
   - ✅ AVAX balance shows
   - ✅ Credits balance shows (1000)
   - ✅ Can navigate to account page
   - ✅ Disconnect works

### Test Network Switching

1. Connect on wrong network (Ethereum Mainnet)
2. Click "Switch to Avalanche Network"
3. Verify: MetaMask prompts to add/switch network
4. Verify: App detects correct network after switch

## Troubleshooting

### MetaMask Not Detected

**Solution**: Ensure MetaMask extension is installed and enabled

### Wrong Network

**Solution**: Click "Switch to Avalanche Network" button or manually switch in MetaMask

### Connection Fails

**Solution**:

1. Unlock MetaMask wallet
2. Refresh the page
3. Try connecting again

### Balance Not Showing

**Solution**:

1. Ensure wallet has test AVAX
2. Check Firestore has user document
3. Verify network connection

## Production Deployment

Before deploying to mainnet:

1. **Update Network Config**

   ```typescript
   // In src/lib/services/web3/auth.ts
   const CURRENT_NETWORK = "mainnet"; // Change from 'fuji'
   ```

2. **Update Environment Variables**

   ```env
   PUBLIC_AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
   PUBLIC_CHAIN_ID=43114
   ```

3. **Test Thoroughly**

   - Test all wallet connections
   - Test disconnections
   - Test network switching
   - Test balance updates
   - Test on multiple browsers

4. **Update UI Messages**
   - Remove "Testnet" references
   - Remove faucet link
   - Update to "Avalanche Mainnet"

---

**Status**: ✅ Complete and Ready for Hackathon Demo

**Built for Avalanche Hackathon** 🚀
_Crypto-native prediction markets with MetaMask_

