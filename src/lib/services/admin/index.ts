/**
 * Admin Service
 * 
 * Handles admin-only operations like creating and settling markets.
 * Updated to use the new firebase.ts module.
 */

import { httpsCallable } from 'firebase/functions';
import {
	collection,
	doc,
	addDoc,
	updateDoc,
	setDoc,
	Timestamp
} from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseFunctions } from '$lib/firebase';
import { browser } from '$app/environment';
import { predictionMarketContract } from '../web3/contracts';
import { CONTRACTS_DEPLOYED } from '$lib/config';
import { initializePool, calculateProbability } from '$lib/utils/amm';
import type {
	CreateMarketInput,
	SettleMarketInput,
	SettleMarketResponse,
	Market
} from '$lib/types';

/**
 * Create a new market with options
 * 
 * BLOCKCHAIN MODE: Creates market on-chain first, then syncs to Firestore
 */
export async function createMarket(input: CreateMarketInput): Promise<string> {
	if (!browser) throw new Error('Cannot create market during SSR');
	
	const db = getFirebaseFirestore();

	if (CONTRACTS_DEPLOYED) {
		console.log('🔗 Creating market on blockchain...');
		
		try {
			// 1. Create market on blockchain
			const closeTimeUnix = Math.floor(input.closeAt.getTime() / 1000);
			const optionLabels = input.options.map(o => o.label);
			
			const { marketId: onChainMarketId, txHash } = await predictionMarketContract.createMarket(
				input.title,
				optionLabels,
				closeTimeUnix
			);
			
			console.log('✅ Market created on blockchain:', { onChainMarketId, txHash });
			
			// 2. Sync to Firestore using blockchain ID
			const marketData: Omit<Market, 'id'> = {
				title: input.title,
				description: input.description || '',
				sport: input.sport || 'football',
				status: 'open',
				resolution: null,
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),
				closeAt: Timestamp.fromDate(input.closeAt)
			};

			// Use blockchain marketId as Firestore document ID
			const marketRef = doc(db, 'markets', onChainMarketId);
			await setDoc(marketRef, {
				...marketData,
				blockchainId: onChainMarketId,
				txHash
			});

			// 3. Create options subcollection with AMM pools
			const optionsRef = collection(db, 'markets', onChainMarketId, 'options');

			// Calculate default probability (equal distribution if not provided)
			const defaultProbability = 1 / input.options.length;

			for (let i = 0; i < input.options.length; i++) {
				const option = input.options[i];
				const initialLiquidity = option.liquidity ?? 0;
				
				// Initialize AMM pool with the provided liquidity
				const pool = initializePool(initialLiquidity);
				const calculatedProbability = calculateProbability(pool);
				
				await setDoc(doc(optionsRef, i.toString()), {
					label: option.label,
					probability: option.probability ?? calculatedProbability,
					initialLiquidity: initialLiquidity,
					// Store AMM pool state
					ammPool: {
						yesShares: pool.yesShares,
						noShares: pool.noShares,
						k: pool.k,
						liquidity: pool.liquidity
					},
					yesVolume: 0,
					noVolume: 0,
					order: i
				});
			}

			console.log('✅ Market synced to Firestore with ID:', onChainMarketId);
			return onChainMarketId;
			
		} catch (error) {
			console.error('❌ Failed to create market on blockchain:', error);
			throw error;
		}
	} else {
		// Fallback: Create in Firestore only
		console.warn('⚠️ Creating market in Firestore only (contracts not deployed)');
		
		const marketsRef = collection(db, 'markets');

		const marketData: Omit<Market, 'id'> = {
			title: input.title,
			description: input.description || '',
			sport: input.sport || 'football',
			status: 'open',
			resolution: null,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			closeAt: Timestamp.fromDate(input.closeAt)
		};

		const marketDoc = await addDoc(marketsRef, marketData);
		const marketId = marketDoc.id;

		// Create options subcollection with AMM pools
		const optionsRef = collection(db, 'markets', marketId, 'options');

		// Calculate default probability (equal distribution if not provided)
		const defaultProbability = 1 / input.options.length;

		for (let i = 0; i < input.options.length; i++) {
			const option = input.options[i];
			const initialLiquidity = option.liquidity ?? 0;
			
			// Initialize AMM pool with the provided liquidity
			const pool = initializePool(initialLiquidity);
			const calculatedProbability = calculateProbability(pool);
			
			await addDoc(optionsRef, {
				label: option.label,
				probability: option.probability ?? calculatedProbability,
				initialLiquidity: initialLiquidity,
				// Store AMM pool state
				ammPool: {
					yesShares: pool.yesShares,
					noShares: pool.noShares,
					k: pool.k,
					liquidity: pool.liquidity
				},
				yesVolume: 0,
				noVolume: 0,
				order: i
			});
		}

		return marketId;
	}
}

/**
 * Update market status
 */
export async function updateMarketStatus(
	marketId: string,
	status: 'open' | 'closed' | 'settled'
): Promise<void> {
	if (!browser) return;
	
	const db = getFirebaseFirestore();
	const marketRef = doc(db, 'markets', marketId);

	await updateDoc(marketRef, {
		status,
		updatedAt: Timestamp.now()
	});
}

/**
 * Close a market (stop accepting bets)
 */
export async function closeMarket(marketId: string): Promise<void> {
	return updateMarketStatus(marketId, 'closed');
}

/**
 * Settle a market via Cloud Function
 */
export async function settleMarket(
	marketId: string,
	winningOptionId: string
): Promise<SettleMarketResponse> {
	if (!browser) {
		return { success: false, error: 'Cannot settle market during SSR' };
	}
	
	const functions = getFirebaseFunctions();
	const settleMarketFn = httpsCallable<SettleMarketInput, SettleMarketResponse>(
		functions,
		'settleMarket'
	);

	try {
		const result = await settleMarketFn({ marketId, winningOptionId });
		return result.data;
	} catch (error) {
		console.error('Error settling market:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to settle market'
		};
	}
}
