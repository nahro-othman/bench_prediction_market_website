/**
 * Bets Service - Cloud Function Integrated
 * 
 * Handles betting operations via Firebase Cloud Functions
 * 
 * Flow:
 * 1. User submits bet via UI
 * 2. Check wallet connection
 * 3. Call Cloud Function placeBet()
 * 4. Cloud Function handles atomic transaction
 * 5. Position created in Firestore
 * 6. UI updates in real-time
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
import { CONTRACTS_DEPLOYED } from '$lib/config';
import type {
	Position,
	PlaceBetInput,
	PlaceBetResponse,
	BetSide
} from '$lib/types';

/**
 * Place a bet using REAL AVAX from wallet (BLOCKCHAIN MODE)
 * 
 * This calls the smart contract directly and pays with AVAX!
 * - MetaMask popup will appear
 * - User pays real AVAX
 * - Transaction on Avalanche blockchain
 * - Verifiable on Snowtrace
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
		console.log('💰 Placing bet with REAL AVAX from wallet...', {
			marketId,
			optionId,
			side,
			stake,
			address: wallet.address
		});

		// Check if contracts are deployed
		console.log('🔍 Contracts deployed:', CONTRACTS_DEPLOYED);

		if (CONTRACTS_DEPLOYED) {
			// 🚀 BLOCKCHAIN MODE - Pay with real AVAX!
			console.log('🔗 Using blockchain - Real AVAX payment!');
			const result = await placeBlockchainBet(marketId, optionId, side, stake);
			
			if (result.success) {
				console.log('✅ Blockchain bet placed successfully!', result);
			} else {
				console.error('❌ Blockchain bet failed:', result.error);
			}
			
			return result;
		} else {
			// Fallback if contracts not deployed (should not happen now!)
			return {
				success: false,
				error: 'Smart contracts not deployed. Please set up contracts first.'
			};
		}

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
 * Place bet via Cloud Function (NEW - PRIMARY PATH)
 * 
 * This calls the Firebase Cloud Function which handles:
 * - Atomic transactions
 * - Balance validation
 * - Position creation
 * - Volume updates
 * 
 * NO AUTH REQUIRED - Uses wallet address directly!
 */
async function placeCloudFunctionBet(
	marketId: string,
	optionId: string,
	side: BetSide,
	stake: number
): Promise<PlaceBetResponse> {
	try {
		console.log('📞 Calling Cloud Function placeBet...');
		
		const wallet = get(walletStore);
		
		if (!wallet.address) {
			return {
				success: false,
				error: 'Wallet not connected'
			};
		}
		
		console.log('💳 Using wallet address:', wallet.address);
		
		const functions = getFirebaseFunctions();
		const placeBetFn = httpsCallable(functions, 'placeBet');
		
		const result = await placeBetFn({
			marketId,
			optionId,
			side,
			stake,
			walletAddress: wallet.address // Pass wallet address (no auth needed!)
		});

		const data = result.data as any;
		
		console.log('📦 Cloud Function response:', data);

		if (data.success) {
			return {
				success: true,
				positionId: data.positionId,
				newBalance: data.newBalance,
				message: `Bet placed successfully! New balance: ${data.newBalance?.toFixed(2) || 0} credits`
			};
		} else {
			return {
				success: false,
				error: data.error || 'Cloud Function returned error'
			};
		}

	} catch (error: any) {
		console.error('💥 Cloud Function call failed:', error);
		
		// Parse Firebase error messages
		let errorMessage = 'Failed to place bet';
		if (error.code === 'unauthenticated') {
			errorMessage = 'Authentication failed. Make sure your wallet is connected.';
		} else if (error.code === 'permission-denied') {
			errorMessage = 'Permission denied. Check Firestore security rules.';
		} else if (error.code === 'not-found') {
			errorMessage = 'Market or option not found';
		} else if (error.code === 'failed-precondition') {
			errorMessage = error.message || 'Requirements not met';
		} else if (error.message) {
			errorMessage = error.message;
		}
		
		return {
			success: false,
			error: errorMessage
		};
	}
}

/**
 * Place bet via blockchain (BLOCKCHAIN PATH - for future use)
 */
async function placeBlockchainBet(
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

		if (!marketSnap.exists()) {
			return { success: false, error: 'Market not found' };
		}
		
		if (!optionSnap.exists()) {
			return { success: false, error: 'Option not found' };
		}

		const option = optionSnap.data();
		const market = marketSnap.data();

		// Get blockchain IDs from Firestore documents
		const blockchainMarketId = market.blockchainId || marketId;
		const blockchainOptionId = option.order; // Use option order as blockchain option ID
		
		console.log('🔗 Blockchain Market ID:', blockchainMarketId);
		console.log('🔗 Blockchain Option ID:', blockchainOptionId);
		console.log('📄 Firestore Market ID:', marketId);
		console.log('📄 Firestore Option ID:', optionId);

		// Check AVAX balance
		const avaxBalance = parseFloat(wallet.balance || '0');
		if (avaxBalance < stake) {
			return { 
				success: false, 
				error: `Insufficient AVAX balance. You have ${avaxBalance.toFixed(2)} AVAX but need ${stake.toFixed(2)} AVAX` 
			};
		}

		// Call smart contract with blockchain IDs
		console.log('📡 Calling smart contract placeBet()...');
		const isYes = side === 'yes';
		const { positionId, txHash } = await predictionMarketContract.placeBet(
			blockchainMarketId,  // ← Blockchain market ID
			blockchainOptionId,  // ← Blockchain option ID (order: 0, 1, 2, etc.)
			isYes,
			stake.toString()
		);

		console.log('✅ Transaction confirmed:', txHash);
		console.log('✅ Position ID:', positionId);

		// Sync position to Firestore for UI (optional - non-critical)
		try {
			const positionRef = doc(db, 'positions', positionId);
			await setDoc(positionRef, {
				userId: wallet.address,
				walletAddress: wallet.address,
				marketId,
				optionId,
				optionLabel: option.label,
				marketTitle: market.title,
				side,
				stake,
				probabilityAtBet: option.probability,
				createdAt: serverTimestamp(),
				settled: false,
				payout: null,
				blockchain: true,
				txHash,
				chainId: 43113 // Fuji testnet
			});
			console.log('✅ Position synced to Firestore');

			// Update option volume in Firestore (for UI consistency)
			const volumeField = side === 'yes' ? 'yesVolume' : 'noVolume';
			await setDoc(optionRef, {
				[volumeField]: (option[volumeField] || 0) + stake
			}, { merge: true });
			console.log('✅ Option volume updated in Firestore');
		} catch (firestoreError) {
			console.warn('⚠️ Firestore sync failed (non-critical):', firestoreError.message);
			// Continue anyway - blockchain transaction succeeded!
		}

		return {
			success: true,
			positionId,
			message: `🎉 Bet placed successfully with real AVAX! TX: ${txHash.substring(0, 10)}...`,
			txHash
		};

	} catch (error) {
		console.error('💥 Blockchain bet failed:', error);
		
		// Parse blockchain error messages
		let errorMessage = 'Failed to place bet';
		if (error instanceof Error) {
			if (error.message.includes('insufficient funds')) {
				errorMessage = 'Insufficient AVAX for transaction';
			} else if (error.message.includes('user rejected')) {
				errorMessage = 'Transaction rejected by user';
			} else if (error.message.includes('Market closed')) {
				errorMessage = 'Market is closed for betting';
			} else if (error.message.includes('Insufficient payment')) {
				errorMessage = 'Insufficient AVAX sent';
			} else {
				errorMessage = error.message;
			}
		}
		
		return {
			success: false,
			error: errorMessage
		};
	}
}

/**
 * Fallback to direct Firestore writes (DEVELOPMENT ONLY)
 * 
 * ⚠️ WARNING: This bypasses blockchain entirely!
 * Only use for development/testing when contracts aren't deployed.
 * NOT SUITABLE FOR PRODUCTION.
 */
async function fallbackPlaceBet(
	marketId: string,
	optionId: string,
	side: BetSide,
	stake: number
): Promise<PlaceBetResponse> {
	try {
		console.log('⚠️ Using fallback bet placement (Firestore only - no blockchain)');
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

		// Check AVAX balance (cosmetic check only - no actual deduction!)
		const avaxBalance = parseFloat(wallet.balance || '0');
		console.log('💰 AVAX balance:', avaxBalance, 'Stake:', stake);
		
		if (avaxBalance < stake) {
			console.error('❌ Insufficient balance');
			return { success: false, error: `Insufficient AVAX balance. You have ${avaxBalance.toFixed(2)} AVAX but need ${stake.toFixed(2)} AVAX` };
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

		// Create position (stored in AVAX - NO ACTUAL BLOCKCHAIN TRANSACTION!)
		console.log('📝 Creating position in Firestore...');
		const positionRef = await addDoc(collection(db, 'positions'), {
			userId: wallet.address,
			walletAddress: wallet.address,
			marketId,
			optionId,
			optionLabel: option.label,
			marketTitle: market.title,
			side,
			stake,  // In AVAX (but not actually spent!)
			probabilityAtBet: option.probability,
			createdAt: serverTimestamp(),
			settled: false,
			payout: null,
			blockchain: false, // Mark as not on blockchain
			fallback: true // Mark as fallback bet
		});
		console.log('✅ Position created with ID:', positionRef.id);

		// Update option volume (in AVAX)
		console.log('📊 Updating option volume...');
		const volumeField = side === 'yes' ? 'yesVolume' : 'noVolume';
		await setDoc(optionRef, {
			[volumeField]: (option[volumeField] || 0) + stake
		}, { merge: true });
		console.log('✅ Option volume updated');

		console.log('⚠️ Fallback bet completed (DATABASE ONLY - NO BLOCKCHAIN TRANSACTION)');

		return {
			success: true,
			positionId: positionRef.id,
			message: `Bet placed successfully! You bet ${stake.toFixed(2)} AVAX on ${side.toUpperCase()}. (Dev mode: no blockchain transaction)`
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
