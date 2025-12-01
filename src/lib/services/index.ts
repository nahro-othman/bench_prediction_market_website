/**
 * Services Index
 * 
 * Re-exports services for convenient imports.
 * With SvelteFire, most data fetching is done via components.
 * These services handle operations that need Cloud Functions.
 */

// Bets service - for placing bets via Cloud Function
export { placeBet, getUserPositions, subscribeToUserPositions } from './bets';

// Admin service - for market management
export { createMarket, updateMarketStatus, closeMarket, settleMarket } from './admin';
