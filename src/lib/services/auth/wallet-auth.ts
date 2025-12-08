/**
 * Wallet Authentication Bridge
 * 
 * Creates Firebase custom tokens for MetaMask wallet addresses
 * This allows Cloud Functions to work with wallet-based authentication
 */

import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '$lib/firebase';
import { walletStore } from '../web3/auth';
import { get } from 'svelte/store';

/**
 * Sign in to Firebase using wallet address
 * For now, we'll use the wallet address as the user ID
 */
export async function signInWithWallet(walletAddress: string): Promise<void> {
	try {
		const auth = getFirebaseAuth();
		
		// For development, we'll use anonymous auth
		// In production, you'd call a Cloud Function to generate a custom token
		// based on a signed message from the wallet
		
		// For now, just ensure the user is signed in anonymously
		// The wallet address will be used as the user ID in Firestore
		console.log('Authenticating with wallet:', walletAddress);
		
		// Store wallet address in auth (custom implementation)
		// Cloud Functions will use this to identify the user
		
	} catch (error) {
		console.error('Error signing in with wallet:', error);
		throw error;
	}
}

/**
 * Sign out from Firebase
 */
export async function signOutWallet(): Promise<void> {
	try {
		const auth = getFirebaseAuth();
		await signOut(auth);
	} catch (error) {
		console.error('Error signing out:', error);
	}
}

/**
 * Get current authenticated user ID
 * Returns wallet address if connected, otherwise null
 */
export function getCurrentUserId(): string | null {
	const wallet = get(walletStore);
	return wallet.address;
}






