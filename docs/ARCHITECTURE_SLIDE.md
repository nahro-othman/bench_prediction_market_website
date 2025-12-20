# Bench Prediction Market - Architecture (Slide Version)

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (SvelteKit)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Markets   │  │   Betting   │  │    Admin    │                 │
│  │   UI        │  │   Dialog    │  │  Dashboard  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│  • Web3 (MetaMask/Ethers.js) • AI Services • Real-time UI           │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌──────────▼──────────┐
         │   FIREBASE          │   │   AVALANCHE         │
         │   (Backend)         │   │   (Blockchain)      │
         │                     │   │                     │
         │ • Firestore         │   │ • PredictionMarket  │
         │ • Cloud Functions    │   │ • X402Payment       │
         │ • Storage           │   │ • ERC8004Token      │
         │ • Auth              │   │                     │
         └────────────────────┘   └─────────────────────┘
```

## Key Components

### Frontend Layer

- **SvelteKit**: Reactive UI framework with TypeScript
- **SvelteFire**: Real-time Firestore subscriptions
- **Ethers.js**: Blockchain wallet integration
- **AI Services**: Market analysis and betting insights

### Backend Layer (Firebase)

- **Firestore**: Real-time database for markets, positions, users
- **Cloud Functions**: Atomic operations (placeBet, settleMarket)
- **Storage**: Evidence uploads and market images
- **Auth**: Wallet-based authentication

### Blockchain Layer (Avalanche)

- **PredictionMarket.sol**: Core market logic and betting
- **X402Payment.sol**: Streamlined payments (30% gas savings)
- **ERC8004Token.sol**: Conditional transfers (zero-gas claims)

## Data Flow

**Betting Flow:**

```
User → Frontend → Cloud Function → Firestore → Real-time UI Update
                    ↓ (optional)
              Smart Contract (on-chain)
```

**Settlement Flow:**

```
Admin → Cloud Function → Firestore Batch → Calculate Payouts → Update Balances
```

## Technology Stack

| Component  | Technology                               |
| ---------- | ---------------------------------------- |
| Frontend   | SvelteKit, TypeScript, Tailwind          |
| Backend    | Firebase (Firestore, Functions, Storage) |
| Blockchain | Solidity, Hardhat, Avalanche C-Chain     |
| Web3       | Ethers.js, MetaMask                      |
| Real-time  | SvelteFire                               |

## Key Features

✅ **Off-Chain First**: Fast, cost-effective operations in Firestore  
✅ **On-Chain Optional**: Trustless settlement via smart contracts  
✅ **Real-time Sync**: Instant UI updates without polling  
✅ **Gas Optimized**: x402 payments reduce costs by 30%  
✅ **AI-Powered**: Market analysis and betting insights

---

_Built for Hack2Build: Payments x402 Edition_





