# Bench - Football Prediction Market

A clean, modern prediction market web app for football outcomes. Built with SvelteKit, Firebase, and Cloud Functions.

![Bench Preview](https://via.placeholder.com/800x400?text=Bench+Prediction+Market)

## Features

- 🎯 **Browse Markets** - View prediction markets for football events
- 💰 **Place Bets** - Bet YES or NO on outcomes with virtual credits
- 📊 **Track Positions** - View open and settled bets
- 🔐 **Secure Auth** - Email/password and Google sign-in
- ⚡ **Real-time Updates** - Live market and balance updates

## Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Cloud Functions)
- **Deployment**: Firebase Hosting (or any SvelteKit adapter)

## Project Structure

```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── auth/        # Authentication forms
│   │   ├── layout/      # Layout components (Navbar)
│   │   └── markets/     # Market-related components
│   ├── services/        # Business logic & API calls
│   │   ├── admin/       # Admin operations
│   │   ├── auth/        # Auth operations
│   │   ├── bets/        # Betting operations
│   │   ├── firebase/    # Firebase client setup
│   │   └── markets/     # Market data operations
│   ├── stores/          # Svelte stores for state
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── routes/              # SvelteKit routes (pages)
│   ├── account/         # User account page
│   ├── admin/           # Admin dashboard
│   ├── login/           # Login page
│   ├── markets/[id]/    # Market detail page
│   └── signup/          # Sign up page
└── app.css              # Global styles

functions/               # Cloud Functions
└── src/
    └── index.ts         # placeBet & settleMarket functions
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

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

### 5. Run Development Server

```bash
# Start the SvelteKit dev server
npm run dev

# In another terminal, start Firebase emulators (optional)
firebase emulators:start
```

The app will be available at `http://localhost:5173`

### 6. Deploy

```bash
# Build the SvelteKit app
npm run build

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy hosting (if using Firebase Hosting)
firebase deploy --only hosting
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
  side: 'yes' | 'no';
  stake: number;
  probabilityAtBet: number;
  createdAt: Timestamp;
  settled: boolean;
  payout: number | null;
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `ADMIN_UIDS` | (Functions) Comma-separated admin user IDs |

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


