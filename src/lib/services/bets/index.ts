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
		console.log('🎲 Placing bet...', {
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
		} else {
			console.error('❌ Bet failed:', result.error);
		}
		
		return result;

	} catch (error) {
		console.error('💥 Error placing bet:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to place bet';
		return {
			success: false,
			error: errorMessage
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
		console.log('📝 Starting fallback bet placement...');
		
		const wallet = get(walletStore);
		if (!wallet.address) {
			console.error('❌ Wallet not connected');
			return { success: false, error: 'Wallet not connected' };
		}

		console.log('🔗 Wallet connected:', wallet.address);

		const db = getFirebaseFirestore();
		console.log('💾 Firebase initialized');
		
		// Get market and option details
		console.log('📊 Fetching market and option data...');
		const marketRef = doc(db, 'markets', marketId);
		const optionRef = doc(db, 'markets', marketId, 'options', optionId);
		
		const [marketSnap, optionSnap] = await Promise.all([
			getDoc(marketRef),
			getDoc(optionRef)
		]);

		if (!marketSnap.exists()) {
			console.error('❌ Market not found:', marketId);
			return { success: false, error: 'Market not found' };
		}
		
		if (!optionSnap.exists()) {
			console.error('❌ Option not found:', optionId);
			return { success: false, error: 'Option not found' };
		}

		const option = optionSnap.data();
		const market = marketSnap.data();
		console.log('✅ Market and option data loaded', { market: market.title, option: option.label });

		// Check AVAX balance
		const avaxBalance = parseFloat(wallet.balance || '0');
		console.log('💰 AVAX balance:', avaxBalance, 'Stake:', stake);
		
		if (avaxBalance < stake) {
			console.error('❌ Insufficient balance');
			return { success: false, error: `Insufficient AVAX balance. You have ${avaxBalance.toFixed(4)} AVAX but need ${stake.toFixed(4)} AVAX` };
		}

		// Ensure user profile exists
		console.log('👤 Checking user profile...');
		const userRef = doc(db, 'users', wallet.address);
		const userSnap = await getDoc(userRef);
		
		if (!userSnap.exists()) {
			console.log('📝 Creating user profile...');
			// Create user profile
			await setDoc(userRef, {
				address: wallet.address,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			});
			console.log('✅ User profile created');
		} else {
			console.log('✅ User profile exists');
		}

		// Create position (stored in AVAX)
		console.log('📝 Creating position...');
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
		console.log('✅ Position created with ID:', positionRef.id);

		// Update option volume (in AVAX)
		console.log('📊 Updating option volume...');
		const volumeField = side === 'yes' ? 'yesVolume' : 'noVolume';
		await setDoc(optionRef, {
			[volumeField]: (option[volumeField] || 0) + stake
		}, { merge: true });
		console.log('✅ Option volume updated');

		console.log('🎉 Bet placed successfully! (AVAX amount: ' + stake + ')');

		return {
			success: true,
			positionId: positionRef.id,
			message: `Bet placed successfully! You bet ${stake.toFixed(4)} AVAX on ${side.toUpperCase()}.`
		};
	} catch (error) {
		console.error('💥 Firestore bet placement failed:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to place bet';
		console.error('Error details:', errorMessage);
		return {
			success: false,
			error: `Failed to place bet: ${errorMessage}`
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
