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
	Timestamp
} from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseFunctions } from '$lib/firebase';
import { browser } from '$app/environment';
import type {
	CreateMarketInput,
	SettleMarketInput,
	SettleMarketResponse,
	Market
} from '$lib/types';

/**
 * Create a new market with options
 */
export async function createMarket(input: CreateMarketInput): Promise<string> {
	if (!browser) throw new Error('Cannot create market during SSR');
	
	const db = getFirebaseFirestore();
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

	// Create options subcollection
	const optionsRef = collection(db, 'markets', marketId, 'options');

	for (let i = 0; i < input.options.length; i++) {
		const option = input.options[i];
		await addDoc(optionsRef, {
			label: option.label,
			probability: option.probability,
			yesVolume: 0,
			noVolume: 0,
			order: i
		});
	}

	return marketId;
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
