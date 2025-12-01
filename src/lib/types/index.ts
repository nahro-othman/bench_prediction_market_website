/**
 * TypeScript Types for Bench Prediction Market
 * 
 * These types mirror the Firestore data model and ensure type safety
 * throughout the application. They're used by services, stores, and components.
 * 
 * Collection structure in Firestore:
 * - markets/{marketId} - Market documents
 * - markets/{marketId}/options/{optionId} - Options subcollection
 * - users/{uid} - User profiles
 * - positions/{positionId} - User betting positions
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Market status enum
 * - open: Accepting bets
 * - closed: No longer accepting bets, awaiting settlement
 * - settled: Final, payouts distributed
 */
export type MarketStatus = 'open' | 'closed' | 'settled';

/**
 * Betting side
 * - yes: Betting that the option will happen
 * - no: Betting against the option
 */
export type BetSide = 'yes' | 'no';

/**
 * Market - A prediction question with multiple options
 * 
 * Example: "Who will win World Cup 2026?"
 * Options: Spain, Brazil, Germany, France
 */
export interface Market {
	id: string;
	title: string;
	description?: string;
	sport: string; // Default: "football"
	status: MarketStatus;
	resolution?: string | null; // ID of winning option, or null if not yet resolved
	createdAt: Timestamp;
	updatedAt: Timestamp;
	closeAt: Timestamp; // When the market stops accepting bets
}

/**
 * Market with options loaded - Used for display
 */
export interface MarketWithOptions extends Market {
	options: MarketOption[];
}

/**
 * MarketOption - One possible outcome in a market
 * 
 * Example for "Who will win World Cup 2026?":
 * - label: "Spain"
 * - probability: 0.25 (25%)
 */
export interface MarketOption {
	id: string;
	marketId: string;
	label: string;
	probability: number; // 0-1, displayed as percentage
	yesVolume: number; // Total amount bet on YES
	noVolume: number; // Total amount bet on NO
	order: number; // Display order
}

/**
 * User profile stored in Firestore
 * Created on first sign-in
 */
export interface UserProfile {
	uid: string;
	email: string;
	displayName: string | null;
	photoURL: string | null;
	balance: number; // Demo credits, starts at 1000
	createdAt: Timestamp;
}

/**
 * Position - A user's bet on a market option
 * 
 * Example:
 * - userId: "abc123"
 * - marketId: "world-cup-2026"
 * - optionId: "spain"
 * - side: "yes"
 * - stake: 100
 */
export interface Position {
	id: string;
	userId: string;
	marketId: string;
	optionId: string;
	optionLabel: string; // Denormalized for display
	marketTitle: string; // Denormalized for display
	side: BetSide;
	stake: number;
	probabilityAtBet: number; // Probability when bet was placed (for payout calculation)
	createdAt: Timestamp;
	settled: boolean;
	payout: number | null; // Null if not settled, otherwise the amount won (0 if lost)
}

/**
 * Input type for placing a bet
 */
export interface PlaceBetInput {
	marketId: string;
	optionId: string;
	side: BetSide;
	stake: number;
}

/**
 * Response from placeBet Cloud Function
 */
export interface PlaceBetResponse {
	success: boolean;
	positionId?: string;
	newBalance?: number;
	error?: string;
}

/**
 * Input type for settling a market
 */
export interface SettleMarketInput {
	marketId: string;
	winningOptionId: string;
}

/**
 * Response from settleMarket Cloud Function
 */
export interface SettleMarketResponse {
	success: boolean;
	settledPositions?: number;
	error?: string;
}

/**
 * Input type for creating a market
 */
export interface CreateMarketInput {
	title: string;
	description?: string;
	sport?: string;
	closeAt: Date;
	options: {
		label: string;
		probability: number;
	}[];
}


