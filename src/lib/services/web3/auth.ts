/**
 * Web3 Authentication Service
 * 
 * Handles MetaMask wallet connection and authentication
 * for the Avalanche-based prediction market
 */

import { ethers } from 'ethers';
import { writable, get } from 'svelte/store';
import { getFirebaseFirestore, getFirebaseAuth } from '$lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// Avalanche Network Configuration
export const AVALANCHE_NETWORKS = {
	mainnet: {
		chainId: '0xA86A', // 43114
		chainName: 'Avalanche C-Chain',
		nativeCurrency: {
			name: 'AVAX',
			symbol: 'AVAX',
			decimals: 18
		},
		rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
		blockExplorerUrls: ['https://snowtrace.io/']
	},
	fuji: {
		chainId: '0xA869', // 43113
		chainName: 'Avalanche Fuji Testnet',
		nativeCurrency: {
			name: 'AVAX',
			symbol: 'AVAX',
			decimals: 18
		},
		rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
		blockExplorerUrls: ['https://testnet.snowtrace.io/']
	}
};

// Current network (switch to 'mainnet' for production)
const CURRENT_NETWORK = 'fuji';

// Wallet store with provider and signer
export const walletStore = writable<{
	address: string | null;
	balance: string | null;
	chainId: number | null;
	isConnected: boolean;
	isCorrectNetwork: boolean;
	provider: any | null;
	signer: any | null;
}>({
	address: null,
	balance: null,
	chainId: null,
	isConnected: false,
	isCorrectNetwork: false,
	provider: null,
	signer: null
});

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
	if (typeof window === 'undefined') return false;
	return typeof (window as any).ethereum !== 'undefined';
}

/**
 * Get the current chain ID
 */
async function getCurrentChainId(): Promise<number> {
	if (!isMetaMaskInstalled()) throw new Error('MetaMask not installed');
	const ethereum = (window as any).ethereum;
	const chainId = await ethereum.request({ method: 'eth_chainId' });
	return parseInt(chainId, 16);
}

/**
 * Check if connected to correct Avalanche network
 */
async function isCorrectNetwork(): Promise<boolean> {
	const chainId = await getCurrentChainId();
	const targetChainId = parseInt(AVALANCHE_NETWORKS[CURRENT_NETWORK].chainId, 16);
	return chainId === targetChainId;
}

/**
 * Switch to Avalanche network
 */
export async function switchToAvalanche(): Promise<void> {
	if (!isMetaMaskInstalled()) throw new Error('MetaMask not installed');
	
	const ethereum = (window as any).ethereum;
	const network = AVALANCHE_NETWORKS[CURRENT_NETWORK];

	try {
		// Try to switch to the network
		await ethereum.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: network.chainId }]
		});
	} catch (switchError: any) {
		// This error code indicates that the chain has not been added to MetaMask
		if (switchError.code === 4902) {
			try {
				await ethereum.request({
					method: 'wallet_addEthereumChain',
					params: [network]
				});
			} catch (addError) {
				throw new Error('Failed to add Avalanche network to MetaMask');
			}
		} else {
			throw switchError;
		}
	}
}

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<string> {
	if (!isMetaMaskInstalled()) {
		throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
	}

	try {
		const ethereum = (window as any).ethereum;
		
		// Request account access
		const accounts = await ethereum.request({ 
			method: 'eth_requestAccounts' 
		});
		
		if (!accounts || accounts.length === 0) {
			throw new Error('No accounts found');
		}

		const address = accounts[0];
		
		// Check network
		const correctNetwork = await isCorrectNetwork();
		if (!correctNetwork) {
			await switchToAvalanche();
		}

		// Get balance
		const provider = new ethers.BrowserProvider(ethereum);
		const signer = await provider.getSigner();
		const balance = await provider.getBalance(address);
		const formattedBalance = ethers.formatEther(balance);
		const chainId = await getCurrentChainId();

		// Update store
		walletStore.set({
			address,
			balance: formattedBalance,
			chainId,
			isConnected: true,
			isCorrectNetwork: true,
			provider,
			signer
		});

		// Authenticate with Firebase (needed for Cloud Functions)
		await authenticateWithFirebase(address);

		return address;
	} catch (error: any) {
		console.error('Error connecting wallet:', error);
		throw new Error(error.message || 'Failed to connect wallet');
	}
}

/**
 * Disconnect wallet
 */
export function disconnectWallet(): void {
	walletStore.set({
		address: null,
		balance: null,
		chainId: null,
		isConnected: false,
		isCorrectNetwork: false,
		provider: null,
		signer: null
	});
	
	// Clear from localStorage
	if (typeof window !== 'undefined') {
		localStorage.removeItem('walletAddress');
	}
}

/**
 * Sign message for authentication
 */
export async function signMessage(message: string): Promise<string> {
	if (!isMetaMaskInstalled()) throw new Error('MetaMask not installed');
	
	const ethereum = (window as any).ethereum;
	const provider = new ethers.BrowserProvider(ethereum);
	const signer = await provider.getSigner();
	
	return await signer.signMessage(message);
}

/**
 * Authenticate with Firebase (needed for Cloud Functions to work)
 * Signs in anonymously and links to wallet address
 */
async function authenticateWithFirebase(address: string): Promise<void> {
	try {
		const auth = getFirebaseAuth();
		
		// Sign in anonymously (allows Cloud Functions to work)
		if (!auth.currentUser) {
			console.log('🔐 Signing in anonymously to Firebase...');
			await signInAnonymously(auth);
			console.log('✅ Firebase auth successful');
		}
		
		// Create or update user profile
		await createOrUpdateUser(address);
		
	} catch (error) {
		console.error('❌ Firebase authentication failed:', error);
		// Don't throw - wallet still works, just Cloud Functions might fail
	}
}

/**
 * Create or update user profile in Firestore
 */
async function createOrUpdateUser(address: string): Promise<void> {
	const firestore = getFirebaseFirestore();
	const userRef = doc(firestore, 'users', address);
	
	// Check if user exists
	const userSnap = await getDoc(userRef);
	
	if (!userSnap.exists()) {
		// Create new user with starting balance
		await setDoc(userRef, {
			walletAddress: address,
			balance: 1000, // Starting balance
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			totalBets: 0,
			totalWinnings: 0
		});
		console.log('✅ Created user profile with 1000 credits');
	} else {
		// Update last login
		await setDoc(userRef, {
			updatedAt: serverTimestamp()
		}, { merge: true });
		console.log('✅ Updated user profile');
	}
	
	// Save to localStorage for persistence
	if (typeof window !== 'undefined') {
		localStorage.setItem('walletAddress', address);
	}
}

/**
 * Auto-connect if previously connected
 */
export async function autoConnectWallet(): Promise<boolean> {
	if (typeof window === 'undefined') return false;
	
	const savedAddress = localStorage.getItem('walletAddress');
	if (!savedAddress || !isMetaMaskInstalled()) return false;

	try {
		const ethereum = (window as any).ethereum;
		const accounts = await ethereum.request({ method: 'eth_accounts' });
		
		if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
			await connectWallet();
			return true;
		}
	} catch (error) {
		console.error('Error auto-connecting wallet:', error);
	}
	
	return false;
}

/**
 * Listen for account and network changes
 */
export function setupWalletListeners(): void {
	if (typeof window === 'undefined' || !isMetaMaskInstalled()) return;
	
	const ethereum = (window as any).ethereum;

	// Account changed
	ethereum.on('accountsChanged', async (accounts: string[]) => {
		if (accounts.length === 0) {
			// User disconnected
			disconnectWallet();
		} else {
			// User switched account
			await connectWallet();
		}
	});

	// Network changed
	ethereum.on('chainChanged', async () => {
		// Reload page when network changes (recommended by MetaMask)
		window.location.reload();
	});
}

/**
 * Get current wallet address
 */
export function getWalletAddress(): string | null {
	return get(walletStore).address;
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
	return get(walletStore).isConnected;
}

