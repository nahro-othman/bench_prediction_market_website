# Bench Prediction Market - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: FRONTEND                        │
│                    (SvelteKit + TypeScript)                 │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     
│  │ Markets  │  │ Betting  │  │  Admin   │  
│  └──────────┘  └──────────┘  └──────────┘   
│                                                              │
│  Web3 (MetaMask) • Real-time UI • SvelteFire                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 2: BACKEND                         │
│                    (Firebase Platform)                       │
│                                                              │
│  • Firestore (Real-time Database)                           │
│  • Cloud Functions (placeBet, settleMarket)                  │
│  • Storage (Evidence uploads)                               │
│  • Auth (Wallet-based authentication)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ RPC Calls (Ethers.js)
                            │
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 3: BLOCKCHAIN                      │
│                    (Avalanche C-Chain)                      │
│                                                              │
│  • PredictionMarket.sol (Market logic)                      │
│  • X402Payment.sol (30% gas savings)                        │
│                │
└─────────────────────────────────────────────────────────────┘
```

## Component Interactions

### 1. **User Betting Flow**

```
User → Frontend (BetDialog)
  → Cloud Function (placeBet)
  → Firestore Transaction (atomic update)
  → Real-time UI update via SvelteFire
  → Optional: Smart Contract (on-chain bet)
```

### 2. **Market Settlement Flow**

```
Admin → Frontend (Admin Dashboard)
  → Cloud Function (settleMarket)
  → Firestore Batch Write (update all positions)
  → Calculate payouts (stake × 1/probability)
  → Update user balances
  → Real-time UI update
```

### 3. **Real-time Data Sync**

```
Firestore → SvelteFire (reactive subscriptions)
  → Svelte components auto-update
  → No manual polling needed
```

### 4. **Blockchain Integration**

```
Frontend → Ethers.js → Avalanche RPC
  → Smart Contract calls
  → Transaction signing (MetaMask)
  → Event listening for updates
```

## Key Technologies

| Layer          | Technology         | Purpose                      |
| -------------- | ------------------ | ---------------------------- |
| **Frontend**   | SvelteKit 2.x      | Reactive UI framework        |
| **Frontend**   | TypeScript         | Type-safe development        |
| **Frontend**   | Tailwind CSS       | Modern styling               |
| **Frontend**   | Ethers.js          | Blockchain interaction       |
| **Frontend**   | SvelteFire         | Real-time Firestore bindings |
| **Backend**    | Firebase Firestore | Real-time database           |
| **Backend**    | Cloud Functions    | Serverless business logic    |
| **Backend**    | Firebase Storage   | File storage                 |
| **Backend**    | Firebase Auth      | Authentication               |
| **Blockchain** | Solidity           | Smart contract language      |
| **Blockchain** | Hardhat            | Contract development         |
| **Blockchain** | Avalanche C-Chain  | EVM-compatible network       |

## Data Flow Highlights

1. **Off-Chain First**: Most operations happen in Firestore for speed and cost efficiency
2. **On-Chain Optional**: Smart contracts provide trustless settlement when needed
3. **Real-time Updates**: SvelteFire provides instant UI updates without polling
4. **Atomic Operations**: Cloud Functions ensure data consistency with transactions
5. **Gas Optimization**: x402 payments reduce gas costs by 30%

## Security & Validation

- **Firestore Rules**: Database-level access control
- **Cloud Functions**: Server-side validation and authorization
- **Smart Contracts**: Immutable on-chain logic
- **Wallet Auth**: MetaMask signature verification
- **Admin Checks**: UID-based admin verification in Cloud Functions

---

**Built for Hack2Build: Payments x402 Edition**  
_Combining x402 payments, ERC8004 conditional tokens, and AI-powered insights_



