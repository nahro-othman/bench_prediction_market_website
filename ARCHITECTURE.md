# Bench Architecture - AI + Blockchain on Avalanche

## Overview

Bench is a next-generation prediction market platform that combines AI automation with blockchain transparency, built for the Avalanche hackathon. This document explains how x402 payments and ERC8004 tokens enable seamless, intelligent prediction markets.

## Architecture Layers

### 1. Frontend Layer (Svelte)

**Purpose**: User interface and wallet interaction

**Components**:
- **Wallet Connection**: MetaMask/Core wallet integration
- **Market Browser**: Display available prediction markets
- **Betting Interface**: Place bets via x402 payment flows
- **Position Tracking**: View active and settled positions
- **Real-time Updates**: WebSocket connection to Firebase

**Key Technologies**:
- SvelteKit 2.x for reactive UI
- Ethers.js for Avalanche interaction
- TailwindCSS for styling
- SvelteFire for real-time data

### 2. Backend Layer (Firebase + Cloud Functions)

**Purpose**: Off-chain business logic, AI automation, and Oracle integration

**Components**:

#### **Cloud Functions**
```typescript
// placeBet Function
1. Validate user request (balance, market status)
2. Query AI service for market insights
3. Fetch Oracle data for external verification
4. Call smart contract via ethers.js
5. Update Firestore with transaction
6. Emit real-time event to frontend
```

#### **AI Automation**
- **Market Creation**: AI suggests new markets based on trending topics
- **Probability Adjustment**: Machine learning models update odds
- **Risk Management**: Detect unusual betting patterns
- **Settlement Triggers**: Determine optimal settlement timing

#### **Oracle Integration**
- **Sports APIs**: Fetch game results, player stats
- **News Feeds**: Real-world event outcomes
- **Price Feeds**: Cryptocurrency prices for settlement
- **Weather Data**: For conditional markets

**Key Technologies**:
- Firebase Cloud Functions (Node.js)
- Firestore for state management
- OpenAI API for AI decisions
- Chainlink or custom Oracle for data feeds

### 3. Blockchain Layer (Avalanche Smart Contracts)

**Purpose**: Trustless execution, x402 payments, token management

#### **Smart Contracts**

##### **PredictionMarket.sol**
```solidity
// Core prediction market logic
contract PredictionMarket {
    // Create new markets
    function createMarket(string memory question, uint256 closeTime) external;
    
    // Place bet using x402 payment
    function placeBet(uint256 marketId, bool outcome, uint256 amount) external;
    
    // Settle market with Oracle data
    function settleMarket(uint256 marketId, bool outcome) external onlyOracle;
    
    // Claim winnings
    function claimWinnings(uint256 positionId) external;
}
```

##### **X402Payment.sol**
```solidity
// x402 standard implementation for instant payments
contract X402Payment {
    // Initiate payment with metadata
    function initiatePayment(
        address recipient,
        uint256 amount,
        bytes calldata metadata
    ) external returns (bytes32 paymentId);
    
    // Stream payment updates
    function streamPayment(bytes32 paymentId) external;
    
    // Complete or refund
    function finalizePayment(bytes32 paymentId, bool success) external;
}
```

##### **ERC8004Token.sol**
```solidity
// ERC8004 implementation for advanced token features
contract ERC8004Token {
    // Standard ERC20 functions
    function transfer(address to, uint256 amount) external returns (bool);
    
    // ERC8004 extensions
    function conditionalTransfer(
        address to,
        uint256 amount,
        bytes calldata condition
    ) external returns (bool);
    
    // Time-locked transfers for market settlement
    function scheduleTransfer(
        address to,
        uint256 amount,
        uint256 unlockTime
    ) external;
}
```

##### **Oracle.sol**
```solidity
// Oracle interface for external data
contract Oracle {
    // Request data from off-chain source
    function requestData(string memory dataSource) external returns (bytes32 requestId);
    
    // Callback from Oracle service
    function fulfillData(bytes32 requestId, bytes memory data) external;
}
```

**Key Technologies**:
- Solidity ^0.8.0
- Avalanche C-Chain (EVM-compatible)
- Hardhat for development
- OpenZeppelin contracts

## Data Flow Examples

### Example 1: User Places a Bet

```
1. USER CLICKS "YES" BUTTON
   ├─> Frontend: Validate wallet connection
   └─> Frontend: Call placeBet(marketId, optionId, amount)

2. BACKEND VALIDATION
   ├─> Cloud Function: Check user balance in Firestore
   ├─> Cloud Function: Verify market is open
   ├─> Cloud Function: Query AI for risk assessment
   └─> Cloud Function: Fetch Oracle data for current market state

3. BLOCKCHAIN EXECUTION
   ├─> Cloud Function: Call X402Payment.initiatePayment()
   ├─> Smart Contract: Lock user funds
   ├─> Smart Contract: Update market state
   ├─> Smart Contract: Mint position NFT
   └─> Smart Contract: Emit BetPlaced event

4. STATE UPDATE
   ├─> Event Listener: Catch BetPlaced event
   ├─> Cloud Function: Update Firestore with position
   └─> Firestore: Trigger real-time update to frontend

5. USER FEEDBACK
   └─> Frontend: Display confirmation + position details
```

### Example 2: Market Settlement

```
1. MARKET CLOSE TIME REACHED
   ├─> Cloud Function: Scheduled trigger fires
   └─> Cloud Function: Query AI for settlement readiness

2. ORACLE DATA FETCH
   ├─> Cloud Function: Request sports API
   ├─> Oracle: Fetch game result
   ├─> Oracle: Verify data from multiple sources
   └─> Oracle: Sign and submit to blockchain

3. SMART CONTRACT SETTLEMENT
   ├─> Oracle.fulfillData(): Submit verified result
   ├─> PredictionMarket.settleMarket(): Process outcome
   ├─> Calculate winners and payouts
   ├─> ERC8004Token.scheduleTransfer(): Queue payouts
   └─> Emit MarketSettled event

4. AUTOMATIC PAYOUTS
   ├─> Winner positions unlock tokens
   ├─> X402Payment.finalizePayment(): Complete transfers
   └─> Losers' stakes distributed to winners

5. NOTIFICATION
   ├─> Event Listener: Catch MarketSettled
   ├─> Cloud Function: Update all positions in Firestore
   ├─> Cloud Function: Send push notifications
   └─> Frontend: Update user dashboard
```

## x402 Payment Flow

The x402 standard enables fast, efficient payments on Avalanche:

1. **Initiation**: User initiates bet → x402 payment created
2. **Streaming**: Payment status streamed to user in real-time
3. **Completion**: Market settles → x402 finalizes transfers
4. **Efficiency**: No separate approval transactions needed

## ERC8004 Token Features

Advanced token capabilities for prediction markets:

- **Conditional Transfers**: "Transfer only if market resolves YES"
- **Time-Locked Transfers**: Hold funds until settlement
- **Batch Operations**: Settle multiple positions efficiently
- **Gas Optimization**: Reduced costs vs standard ERC20

## AI Integration Points

### Market Creation
- Analyze trending topics (Twitter, news)
- Suggest high-engagement markets
- Set initial probabilities based on historical data

### Probability Updates
- Real-time odds adjustment
- Detect market manipulation
- Rebalance for platform sustainability

### Settlement Automation
- Determine optimal settlement timing
- Validate Oracle data
- Handle edge cases and disputes

## Oracle Architecture

```
External Data Sources (Sports APIs, News, Weather)
            ↓
Oracle Aggregator (Multiple sources, consensus)
            ↓
Data Signing (Cryptographic verification)
            ↓
On-Chain Oracle Contract (Validated data)
            ↓
Prediction Market Contract (Settlement)
```

## Security Considerations

1. **Smart Contract Audits**: All contracts audited pre-launch
2. **Oracle Decentralization**: Multiple data sources
3. **AI Model Security**: Prevent manipulation of AI decisions
4. **Rate Limiting**: Prevent spam and abuse
5. **Emergency Pause**: Circuit breaker for critical issues

## Scalability

- **Avalanche Subnets**: Dedicated subnet for high throughput
- **Off-Chain Storage**: Firestore for non-critical data
- **Event-Driven**: Asynchronous processing
- **Caching**: Redis for hot market data

## Monitoring & Observability

- **Smart Contract Events**: Track all blockchain activity
- **Firebase Analytics**: User behavior tracking
- **Error Tracking**: Sentry for bug reports
- **Performance Metrics**: Response times, gas costs
- **AI Model Monitoring**: Prediction accuracy, drift detection

---

**Built for Avalanche Hackathon** 🚀
*Next generation of AI + Blockchain interactions*


