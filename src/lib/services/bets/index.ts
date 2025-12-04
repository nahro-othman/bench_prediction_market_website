/**
 * Bets Service - Blockchain Integrated
 * 
 * Handles betting operations with Avalanche smart contracts
 * and syncs with Firestore for real-time updates
 */

import { ethers } from 'ethers';
import { httpsCallable } from 'firebase/functions';
import {
	collection,
	query,
	where,
	orderBy,
	getDocs,
	onSnapshot,
	addDoc,
	doc,
	getDoc,
	setDoc,
	serverTimestamp,
	type Unsubscribe
} from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseFunctions } from '$lib/firebase';
import { browser } from '$app/environment';
import { walletStore } from '../web3/auth';
import { predictionMarketContract } from '../web3/contracts';
import { get } from 'svelte/store';
import type {
	Position,
	PlaceBetInput,
	PlaceBetResponse,
	BetSide
} from '$lib/types';

/**
 * Place a bet via blockchain smart contract
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

	const wallet = get(walletStore);
	
	// Check wallet connection
	if (!wallet.isConnected || !wallet.address) {
		return { success: false, error: 'Please connect your wallet' };
	}

	// Check correct network (Avalanche Fuji)
	if (!wallet.isCorrectNetwork) {
		return { success: false, error: 'Please switch to Avalanche Fuji network' };
	}

	try {
		console.log('Placing bet...', {
			marketId,
			optionId,
			side,
			stake,
			address: wallet.address
		});

		// For now, use Cloud Functions for reliable betting
		// Blockchain integration can be enabled after full testing
		const result = await fallbackPlaceBet(marketId, optionId, side, stake);
		
		if (result.success) {
			console.log('✅ Bet placed successfully!', result);
		}
		
		return result;

	} catch (error) {
		console.error('Error placing bet:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to place bet'
		};
	}
}

/**
 * Fallback to direct Firestore writes (for MetaMask auth)
 */
async function fallbackPlaceBet(
	marketId: string,
	optionId: string,
	side: BetSide,
	stake: number
): Promise<PlaceBetResponse> {
	try {
		const wallet = get(walletStore);
		if (!wallet.address) {
			return { success: false, error: 'Wallet not connected' };
		}

		const db = getFirebaseFirestore();
		
		// Get market and option details
		const marketRef = doc(db, 'markets', marketId);
		const optionRef = doc(db, 'markets', marketId, 'options', optionId);
		
		const [marketSnap, optionSnap] = await Promise.all([
			getDoc(marketRef),
			getDoc(optionRef)
		]);

		if (!marketSnap.exists() || !optionSnap.exists()) {
			return { success: false, error: 'Market or option not found' };
		}

		const option = optionSnap.data();
		const market = marketSnap.data();

		// Check AVAX balance
		const avaxBalance = parseFloat(wallet.balance || '0');
		if (avaxBalance < stake) {
			return { success: false, error: 'Insufficient AVAX balance' };
		}

		// Ensure user profile exists
		const userRef = doc(db, 'users', wallet.address);
		const userSnap = await getDoc(userRef);
		
		if (!userSnap.exists()) {
			// Create user profile
			await setDoc(userRef, {
				address: wallet.address,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			});
		}

		// Create position (stored in AVAX)
		const positionRef = await addDoc(collection(db, 'positions'), {
			userId: wallet.address,
			walletAddress: wallet.address,
			marketId,
			optionId,
			optionLabel: option.label,
			marketTitle: market.title,
			side,
			stake,  // Now in AVAX
			probabilityAtBet: option.probability,
			createdAt: serverTimestamp(),
			settled: false,
			payout: null,
			blockchain: false
		});

		// Update option volume (in AVAX)
		const volumeField = side === 'yes' ? 'yesVolume' : 'noVolume';
		await setDoc(optionRef, {
			[volumeField]: (option[volumeField] || 0) + stake
		}, { merge: true });

		console.log('✅ Bet placed successfully! (AVAX amount: ' + stake + ')');

		return {
			success: true,
			positionId: positionRef.id,
			message: 'Bet placed successfully! Note: AVAX will be transferred when on-chain betting is enabled.'
		};
	} catch (error) {
		console.error('Firestore bet placement failed:', error);
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
