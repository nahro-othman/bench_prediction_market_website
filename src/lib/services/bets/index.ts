/**
 * Bets Service
 * 
 * Handles betting operations and position management.
 * Updated to use the new firebase.ts module.
 */

import { httpsCallable } from 'firebase/functions';
import {
	collection,
	query,
	where,
	orderBy,
	getDocs,
	onSnapshot,
	type Unsubscribe
} from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseFunctions } from '$lib/firebase';
import { browser } from '$app/environment';
import type {
	Position,
	PlaceBetInput,
	PlaceBetResponse,
	BetSide
} from '$lib/types';

/**
 * Place a bet via Cloud Function
 */
export async function placeBet(
	marketId: string,
	optionId: string,
	side: BetSide,
	stake: number
): Promise<PlaceBetResponse> {
	if (!browser) {
		return { success: false, error: 'Cannot place bet during SSR' };
	}

	const functions = getFirebaseFunctions();
	const placeBetFn = httpsCallable<PlaceBetInput, PlaceBetResponse>(
		functions,
		'placeBet'
	);

	try {
		const result = await placeBetFn({ marketId, optionId, side, stake });
		return result.data;
	} catch (error) {
		console.error('Error placing bet:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to place bet'
		};
	}
}

/**
 * Get all positions for a user
 */
export async function getUserPositions(userId: string): Promise<Position[]> {
	if (!browser) return [];
	
	const db = getFirebaseFirestore();
	const positionsRef = collection(db, 'positions');
	const positionsQuery = query(
		positionsRef,
		where('userId', '==', userId),
		orderBy('createdAt', 'desc')
	);

	const snapshot = await getDocs(positionsQuery);
	return snapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data()
	})) as Position[];
}

/**
 * Subscribe to user's positions (real-time)
 */
export function subscribeToUserPositions(
	userId: string,
	callback: (positions: Position[]) => void
): Unsubscribe {
	if (!browser) return () => {};
	
	const db = getFirebaseFirestore();
	const positionsRef = collection(db, 'positions');
	const positionsQuery = query(
		positionsRef,
		where('userId', '==', userId),
		orderBy('createdAt', 'desc')
	);

	return onSnapshot(positionsQuery, (snapshot) => {
		const positions = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Position[];
		callback(positions);
	});
}
