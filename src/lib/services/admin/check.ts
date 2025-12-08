/**
 * Admin Authorization Check
 * 
 * Checks if a wallet address is an admin by looking in the Firestore admins collection.
 */

import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '$lib/firebase';
import { browser } from '$app/environment';

/**
 * Check if a wallet address is an admin
 * @param walletAddress - The wallet address to check (with 0x prefix)
 * @returns Promise<boolean> - true if admin, false otherwise
 */
export async function isAdmin(walletAddress: string | null): Promise<boolean> {
	if (!browser || !walletAddress) return false;
	
	try {
		const db = getFirebaseFirestore();
		const adminRef = doc(db, 'admins', walletAddress);
		const adminSnap = await getDoc(adminRef);
		
		const isAdminUser = adminSnap.exists();
		console.log(`🔐 Admin check for ${walletAddress}:`, isAdminUser ? '✅ IS ADMIN' : '❌ NOT ADMIN');
		
		return isAdminUser;
	} catch (error) {
		console.error('Error checking admin status:', error);
		return false;
	}
}

/**
 * Check if a wallet address is an admin (synchronous check using environment variable)
 * Fallback for when Firestore check isn't available
 */
export function isAdminSync(walletAddress: string | null): boolean {
	if (!walletAddress) return false;
	
	// Check environment variable for hardcoded admin addresses
	// This is a fallback - Firestore is the primary method
	const envAdmins = import.meta.env.PUBLIC_ADMIN_ADDRESSES || '';
	const adminAddresses = envAdmins.split(',').map((addr: string) => addr.trim().toLowerCase());
	
	return adminAddresses.includes(walletAddress.toLowerCase());
}




