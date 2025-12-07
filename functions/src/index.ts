/**
 * Cloud Functions for Bench Prediction Market
 *
 * These functions handle critical operations that require atomicity
 * and server-side validation:
 *
 * 1. placeBet - Atomically place a bet with balance validation
 * 2. settleMarket - Admin-only market settlement with payout calculation
 *
 * Security:
 * - All functions require authentication
 * - settleMarket requires admin privileges (UID check)
 * - Firestore transactions ensure data consistency
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all functions
setGlobalOptions({
	region: 'us-central1',
	maxInstances: 10,
});

// Firestore reference
const db = admin.firestore();

// Types matching the client-side types
interface PlaceBetInput {
	marketId: string;
	optionId: string;
	side: 'yes' | 'no';
	stake: number;
	walletAddress?: string; // Optional wallet address for wallet-based auth
}

interface PlaceBetResponse {
	success: boolean;
	positionId?: string;
	newBalance?: number;
	error?: string;
}

interface SettleMarketInput {
	marketId: string;
	winningOptionId: string;
}

interface SettleMarketResponse {
	success: boolean;
	settledPositions?: number;
	error?: string;
}

/**
 * Admin UIDs - In production, use environment variables or Firestore
 * For the MVP, these can be set via Firebase Functions config
 */
const ADMIN_UIDS: string[] = process.env.ADMIN_UIDS?.split(',') || [];

/**
 * Check if a user is an admin
 */
function isAdmin(uid: string): boolean {
	// If no admin UIDs configured, allow any authenticated user (for development)
	if (ADMIN_UIDS.length === 0) {
		console.warn('No ADMIN_UIDS configured - allowing all authenticated users as admin');
		return true;
	}
	return ADMIN_UIDS.includes(uid);
}

/**
 * placeBet Cloud Function
 *
 * Atomically places a bet on a market option.
 * Works with wallet-based authentication (uses wallet address as userId)
 *
 * Transaction steps:
 * 1. Validate market is open and not past closeAt
 * 2. Check user has sufficient balance
 * 3. Create position document
 * 4. Decrease user balance
 * 5. Update option volume
 *
 * @param marketId - ID of the market
 * @param optionId - ID of the option to bet on
 * @param side - "yes" or "no"
 * @param stake - Amount to bet
 */
export const placeBet = onCall<PlaceBetInput>(
	{ cors: true },
	async (request): Promise<PlaceBetResponse> => {
		// Get wallet address from request data (primary)
		// Fallback to auth UID if not provided
		let walletAddress = request.data.walletAddress;
		
		// If no wallet address provided, try to get from auth
		if (!walletAddress && request.auth) {
			walletAddress = request.auth.uid;
		}
		
		if (!walletAddress) {
			console.error('❌ No wallet address provided and no auth');
			throw new HttpsError('unauthenticated', 'Wallet not connected or no authentication');
		}

		const { marketId, optionId, side, stake } = request.data;

		// Input validation
		if (!marketId || !optionId || !side || !stake) {
			throw new HttpsError('invalid-argument', 'Missing required fields');
		}

		if (stake <= 0 || !Number.isFinite(stake)) {
			throw new HttpsError('invalid-argument', 'Stake must be a positive number');
		}

		if (side !== 'yes' && side !== 'no') {
			throw new HttpsError('invalid-argument', 'Side must be "yes" or "no"');
		}

		console.log('📞 Cloud Function placeBet called:', {
			walletAddress,
			marketId,
			optionId,
			side,
			stake,
			hasAuth: !!request.auth
		});

		try {
			const result = await db.runTransaction(async (transaction) => {
				// 1. Get market document
				const marketRef = db.collection('markets').doc(marketId);
				const marketSnap = await transaction.get(marketRef);

				if (!marketSnap.exists) {
					throw new HttpsError('not-found', 'Market not found');
				}

				const market = marketSnap.data()!;

				// 2. Validate market is open
				if (market.status !== 'open') {
					throw new HttpsError(
						'failed-precondition',
						'Market is not open for betting'
					);
				}

				// Check closeAt
				const closeAt = market.closeAt.toDate();
				if (closeAt <= new Date()) {
					throw new HttpsError(
						'failed-precondition',
						'Market has closed for betting'
					);
				}

				// 3. Get option document
				const optionRef = db
					.collection('markets')
					.doc(marketId)
					.collection('options')
					.doc(optionId);
				const optionSnap = await transaction.get(optionRef);

				if (!optionSnap.exists) {
					throw new HttpsError('not-found', 'Option not found');
				}

				const option = optionSnap.data()!;

				// 4. Get user document (using wallet address as userId)
				const userRef = db.collection('users').doc(walletAddress);
				const userSnap = await transaction.get(userRef);

				if (!userSnap.exists) {
					throw new HttpsError('not-found', 'User profile not found');
				}

				const user = userSnap.data()!;
				const currentBalance = user.balance || 0;

				// 5. Check balance
				if (currentBalance < stake) {
					throw new HttpsError(
						'failed-precondition',
						`Insufficient balance. You have ${currentBalance} credits but need ${stake}`
					);
				}

				// 6. Create position document
				const positionRef = db.collection('positions').doc();
				const position = {
					userId: walletAddress,
					walletAddress: walletAddress,
					marketId: marketId,
					optionId: optionId,
					optionLabel: option.label,
					marketTitle: market.title,
					side: side,
					stake: stake,
					probabilityAtBet: option.probability,
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					settled: false,
					payout: null,
					cloudFunction: true
				};

				transaction.set(positionRef, position);

				// 7. Update user balance
				const newBalance = currentBalance - stake;
				transaction.update(userRef, { balance: newBalance });

				// 8. Update option volume
				const volumeField = side === 'yes' ? 'yesVolume' : 'noVolume';
				transaction.update(optionRef, {
					[volumeField]: admin.firestore.FieldValue.increment(stake),
				});

				console.log('✅ Transaction prepared successfully');

				return {
					positionId: positionRef.id,
					newBalance: newBalance,
				};
			});

			console.log('✅ Cloud Function completed successfully:', result);

			return {
				success: true,
				positionId: result.positionId,
				newBalance: result.newBalance,
			};
		} catch (error) {
			console.error('❌ Error placing bet:', error);

			if (error instanceof HttpsError) {
				throw error;
			}

			throw new HttpsError('internal', 'Failed to place bet');
		}
	}
);

/**
 * settleMarket Cloud Function
 *
 * Settles a market and distributes payouts to winning positions.
 * Admin-only function.
 *
 * Transaction steps:
 * 1. Validate admin permissions
 * 2. Mark market as settled
 * 3. Load all positions for the market
 * 4. Calculate payouts (winners get stake * (1 / probabilityAtBet))
 * 5. Update user balances
 * 6. Mark positions as settled
 *
 * Payout formula:
 * - If user bet YES on winning option: payout = stake * (1 / probabilityAtBet)
 * - If user bet NO on non-winning option: payout = stake * (1 / (1 - probabilityAtBet))
 * - Losers get payout = 0
 *
 * @param marketId - ID of the market to settle
 * @param winningOptionId - ID of the winning option
 */
export const settleMarket = onCall<SettleMarketInput>(
	{ cors: true },
	async (request): Promise<SettleMarketResponse> => {
		// Authentication check
		if (!request.auth) {
			throw new HttpsError('unauthenticated', 'Must be logged in');
		}

		const uid = request.auth.uid;

		// Admin check
		if (!isAdmin(uid)) {
			throw new HttpsError(
				'permission-denied',
				'Only admins can settle markets'
			);
		}

		const { marketId, winningOptionId } = request.data;

		// Input validation
		if (!marketId || !winningOptionId) {
			throw new HttpsError('invalid-argument', 'Missing required fields');
		}

		try {
			// Get all positions for this market
			const positionsSnap = await db
				.collection('positions')
				.where('marketId', '==', marketId)
				.where('settled', '==', false)
				.get();

			const positions = positionsSnap.docs;

			// Use batched writes for better performance
			// (Firestore transactions have a limit of 500 operations)
			const batches: admin.firestore.WriteBatch[] = [];
			let currentBatch = db.batch();
			let operationCount = 0;
			const maxOperationsPerBatch = 499; // Leave room for market update

			// Update market status first
			const marketRef = db.collection('markets').doc(marketId);
			currentBatch.update(marketRef, {
				status: 'settled',
				resolution: winningOptionId,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			operationCount++;

			// Track user balance updates (aggregate multiple bets from same user)
			const userBalanceUpdates: Map<string, number> = new Map();

			// Process each position
			for (const positionDoc of positions) {
				const position = positionDoc.data();
				let payout = 0;

				// Determine if this position wins
				const isWinningOption = position.optionId === winningOptionId;
				const betYes = position.side === 'yes';

				if ((isWinningOption && betYes) || (!isWinningOption && !betYes)) {
					// Winner! Calculate payout
					// payout = stake * (1 / effective_probability)
					const effectiveProbability =
						betYes
							? position.probabilityAtBet
							: 1 - position.probabilityAtBet;

					// Clamp probability to prevent extreme payouts
					const clampedProbability = Math.max(
						0.01,
						Math.min(0.99, effectiveProbability)
					);
					payout = Math.round(position.stake * (1 / clampedProbability));
				}

				// Update position
				const positionRef = db.collection('positions').doc(positionDoc.id);
				currentBatch.update(positionRef, {
					settled: true,
					payout: payout,
				});
				operationCount++;

				// Aggregate balance update for user
				const currentUpdate = userBalanceUpdates.get(position.userId) || 0;
				userBalanceUpdates.set(position.userId, currentUpdate + payout);

				// Check if we need a new batch
				if (operationCount >= maxOperationsPerBatch) {
					batches.push(currentBatch);
					currentBatch = db.batch();
					operationCount = 0;
				}
			}

			// Add user balance updates to batches
			for (const [userId, balanceIncrease] of userBalanceUpdates) {
				if (balanceIncrease > 0) {
					const userRef = db.collection('users').doc(userId);
					currentBatch.update(userRef, {
						balance: admin.firestore.FieldValue.increment(balanceIncrease),
					});
					operationCount++;

					if (operationCount >= maxOperationsPerBatch) {
						batches.push(currentBatch);
						currentBatch = db.batch();
						operationCount = 0;
					}
				}
			}

			// Add the last batch if it has operations
			if (operationCount > 0) {
				batches.push(currentBatch);
			}

			// Commit all batches
			await Promise.all(batches.map((batch) => batch.commit()));

			return {
				success: true,
				settledPositions: positions.length,
			};
		} catch (error) {
			console.error('Error settling market:', error);

			if (error instanceof HttpsError) {
				throw error;
			}

			throw new HttpsError('internal', 'Failed to settle market');
		}
	}
);


