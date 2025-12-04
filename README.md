# Bench - Crypto Prediction Market 🚀

A cryptocurrency-based prediction market built on **Avalanche**, featuring MetaMask authentication and streamlined x402 payments.

![Bench Preview](https://via.placeholder.com/800x400?text=Bench+Prediction+Market)

## 🌟 Key Features

- 🔗 **Avalanche-Native** - Built on Avalanche for fast, low-cost transactions
- 💎 **x402 Payments** - Streamlined crypto payments (30% gas savings)
- 🎯 **Decentralized Markets** - Create and trade on prediction markets
- 📊 **Admin Settlement** - Fast market resolution
- 🔐 **MetaMask Auth** - Simple wallet-based authentication
- ⚡ **Lightning Fast** - Sub-second finality on Avalanche

## 🏗️ Architecture

Simple and efficient architecture:

### **3-Layer System**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Svelte)                   │
│  • User Interface • MetaMask Connection • Real-time Updates  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│          Backend Layer (Firebase + Cloud Functions)          │
│  • Off-chain Logic • Request Validation • State Management   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│          Blockchain Layer (Avalanche Smart Contracts)        │
│  • x402 Payment Flows • ERC8004 Tokens                       │
│  • Admin Settlement • Conditional Transfers                  │
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow**

1. **User Action** → Frontend captures MetaMask wallet interaction
2. **Backend** → Firestore stores market state and positions
3. **Smart Contract** → x402 payments for betting (optional integration)
4. **Admin Settlement** → Owner can settle markets and distribute payouts
5. **UI Update** → User sees instant feedback

## 💻 Tech Stack

### Frontend

- **SvelteKit 2.x** - Fast, reactive UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern, responsive styling
- **Web3.js / Ethers.js** - Avalanche wallet integration

### Backend (Off-Chain)

- **Firebase Firestore** - Real-time database for market state
- **Cloud Functions** - Serverless business logic (optional)

### Blockchain (On-Chain)

- **Avalanche C-Chain** - EVM-compatible smart contracts
- **x402 Standard** - Payment flow implementation
- **ERC8004** - Advanced token standard
- **Solidity** - Smart contract language
- **Hardhat/Foundry** - Contract development & testing

## Project Structure

```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── auth/        # Wallet connection & auth
│   │   ├── layout/      # Layout components (Navbar)
│   │   └── markets/     # Market-related components
│   ├── services/        # Business logic & API calls
│   │   ├── admin/       # Admin operations
│   │   ├── auth/        # Web3 auth operations
│   │   ├── bets/        # Betting operations
│   │   ├── web3/        # Blockchain interaction layer
│   │   └── markets/     # Market data operations
│   ├── stores/          # Svelte stores for state
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── routes/              # SvelteKit routes (pages)
│   ├── account/         # User wallet & positions
│   ├── admin/           # Admin dashboard
│   ├── markets/[id]/    # Market detail page
│   └── +page.svelte     # Home page
└── app.css              # Global styles

functions/               # Cloud Functions (optional)
└── src/
    └── index.ts         # Betting and settlement logic

contracts/               # Avalanche Smart Contracts
├── src/
│   ├── PredictionMarket.sol    # Core market logic
│   ├── X402Payment.sol         # x402 payment standard
│   └── ERC8004Token.sol        # ERC8004 token implementation
├── test/                # Contract tests
├── scripts/             # Deployment scripts
└── hardhat.config.js    # Avalanche network config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** and npm
- **Firebase CLI**: `npm install -g firebase-tools`
- **Hardhat**: `npm install -g hardhat`
- **Avalanche Wallet** (Core, MetaMask with Avalanche network)
- **AVAX Testnet Tokens** (from Avalanche Faucet)
- Firebase project configured

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### 2. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable these Firebase services:

   - **Authentication**: Enable Email/Password and Google providers
   - **Firestore**: Create a database in production or test mode
   - **Functions**: Enable Cloud Functions (requires Blaze plan)

3. Get your Firebase config from Project Settings > Your apps > Web app

4. Create a `.env` file in the project root:

```env
PUBLIC_FIREBASE_API_KEY=your-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
PUBLIC_FIREBASE_APP_ID=your-app-id
```

5. Login to Firebase CLI:

```bash
firebase login
firebase use bench-prediction-market
```

### 3. Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Set Up Admin Users

For the MVP, create an `admins` collection in Firestore with documents where the document ID is the admin user's UID.

```javascript
// In Firestore Console, create:
// Collection: admins
// Document ID: <your-firebase-uid>
// Fields: { name: "Admin Name" }
```

### 5. Avalanche Smart Contract Setup

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your wallet private key and Avalanche RPC URLs

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Avalanche Fuji Testnet
npx hardhat run scripts/deploy.js --network fuji

# Verify contracts
npx hardhat verify --network fuji CONTRACT_ADDRESS
```

### 6. Configure Environment Variables

Add Avalanche network configuration to `.env`:

```env
# Firebase Config
PUBLIC_FIREBASE_API_KEY=your-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=bench-prediction-market
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
PUBLIC_FIREBASE_APP_ID=your-app-id

# Avalanche Network
PUBLIC_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PUBLIC_CHAIN_ID=43113
PUBLIC_PREDICTION_MARKET_CONTRACT=0x...
PUBLIC_X402_PAYMENT_CONTRACT=0x...
PUBLIC_ERC8004_TOKEN_CONTRACT=0x...
```

### 7. Run Development Server

```bash
# Start the SvelteKit dev server
npm run dev

# In another terminal, run local Avalanche node (optional)
npx hardhat node

# Deploy contracts to local node
npx hardhat run scripts/deploy.js --network localhost
```

The app will be available at `http://localhost:5173`

### 8. Deploy to Production

```bash
# Build the SvelteKit app
npm run build

# Deploy smart contracts to Avalanche Mainnet
cd contracts
npx hardhat run scripts/deploy.js --network mainnet

# Deploy Cloud Functions
cd ../functions
firebase deploy --only functions

# Deploy frontend
firebase deploy --only hosting
# Or deploy to Vercel/Netlify for better performance
```

## Cloud Functions

### placeBet

Places a bet atomically with these checks:

- Market is open and not past close date
- User has sufficient balance
- Creates position and updates balance in a transaction

### settleMarket

Admin-only function that:

- Validates admin permissions
- Marks market as settled
- Calculates payouts based on probability at bet time
- Updates all user balances

**Payout Formula:**

- Winners: `stake × (1 / probabilityAtBet)`
- Losers: `0`

## Data Model

### Markets

```typescript
{
  id: string;
  title: string;
  description?: string;
  sport: string;
  status: 'open' | 'closed' | 'settled';
  resolution?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closeAt: Timestamp;
}
```

### Options (subcollection of markets)

```typescript
{
  id: string;
  marketId: string;
  label: string;
  probability: number; // 0-1
  yesVolume: number;
  noVolume: number;
  order: number;
}
```

### Users

```typescript
{
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  balance: number;
  createdAt: Timestamp;
}
```

### Positions

```typescript
{
  id: string;
  userId: string;
  marketId: string;
  optionId: string;
  optionLabel: string;
  marketTitle: string;
  side: "yes" | "no";
  stake: number;
  probabilityAtBet: number;
  createdAt: Timestamp;
  settled: boolean;
  payout: number | null;
}
```

## Environment Variables

| Variable                              | Description                                |
| ------------------------------------- | ------------------------------------------ |
| `PUBLIC_FIREBASE_API_KEY`             | Firebase API key                           |
| `PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase Auth domain                       |
| `PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                        |
| `PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket                    |
| `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID               |
| `PUBLIC_FIREBASE_APP_ID`              | Firebase app ID                            |
| `ADMIN_UIDS`                          | (Functions) Comma-separated admin user IDs |

## Security

- **Firestore Rules**: Protect data access at the database level
- **Cloud Functions**: Handle critical operations with server-side validation
- **Client Validation**: UI-level checks for better UX

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this as a starting point for your own project!

---

Built with ❤️ using SvelteKit and Firebase
