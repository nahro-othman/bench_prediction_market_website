/**
 * Web3 Authentication Service
 * 
 * Handles MetaMask and Core wallet connection and authentication
 * for the Avalanche-based prediction market
 */

import { ethers } from 'ethers';
import { writable, get } from 'svelte/store';
import { getFirebaseFirestore, getFirebaseAuth } from '$lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// Wallet Types
export type WalletType = 'metamask' | 'core';

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
	walletType: WalletType | null;
}>({
	address: null,
	balance: null,
	chainId: null,
	isConnected: false,
	isCorrectNetwork: false,
	provider: null,
	signer: null,
	walletType: null
});

/**
 * Get the wallet provider based on type
 */
function getWalletProvider(walletType: WalletType): any {
	if (typeof window === 'undefined') return null;
	
	if (walletType === 'core') {
		// Core wallet uses window.avalanche
		return (window as any).avalanche;
	} else {
		// MetaMask - need to handle multiple wallet scenario
		const ethereum = (window as any).ethereum;
		
		if (!ethereum) return null;
		
		// If multiple wallets are installed, ethereum.providers will be an array
		if (ethereum.providers) {
			// Find MetaMask in the providers array
			const metamaskProvider = ethereum.providers.find((p: any) => p.isMetaMask && !p.isAvalanche);
			if (metamaskProvider) return metamaskProvider;
			
			// Fallback to first MetaMask provider
			const anyMetaMask = ethereum.providers.find((p: any) => p.isMetaMask);
			if (anyMetaMask) return anyMetaMask;
		}
		
		// Single wallet case - check if it's MetaMask
		if (ethereum.isMetaMask && !ethereum.isAvalanche) {
			return ethereum;
		}
		
		// If Core is overriding, still return ethereum as fallback
		return ethereum;
	}
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
	if (typeof window === 'undefined') return false;
	
	const ethereum = (window as any).ethereum;
	if (!ethereum) return false;
	
	// Check if ethereum.providers exists (multiple wallets)
	if (ethereum.providers) {
		return ethereum.providers.some((p: any) => p.isMetaMask);
	}
	
	// Single wallet
	return ethereum.isMetaMask === true;
}

/**
 * Check if Core wallet is installed
 */
export function isCoreWalletInstalled(): boolean {
	if (typeof window === 'undefined') return false;
	
	// Core wallet primarily uses window.avalanche
	const avalanche = (window as any).avalanche;
	if (avalanche) return true;
	
	// Also check if ethereum has Core's identifier
	const ethereum = (window as any).ethereum;
	if (!ethereum) return false;
	
	if (ethereum.providers) {
		return ethereum.providers.some((p: any) => p.isAvalanche);
	}
	
	return ethereum.isAvalanche === true;
}

/**
 * Get the current chain ID
 */
async function getCurrentChainId(provider?: any): Promise<number> {
	const ethereum = provider || (window as any).ethereum || (window as any).avalanche;
	if (!ethereum) throw new Error('No wallet provider found');
	const chainId = await ethereum.request({ method: 'eth_chainId' });
	return parseInt(chainId, 16);
}

/**
 * Check if connected to correct Avalanche network
 */
async function isCorrectNetwork(provider?: any): Promise<boolean> {
	const chainId = await getCurrentChainId(provider);
	const targetChainId = parseInt(AVALANCHE_NETWORKS[CURRENT_NETWORK].chainId, 16);
	return chainId === targetChainId;
}

/**
 * Switch to Avalanche network
 */
export async function switchToAvalanche(walletType?: WalletType): Promise<void> {
	const provider = walletType ? getWalletProvider(walletType) : ((window as any).ethereum || (window as any).avalanche);
	if (!provider) throw new Error('No wallet provider found');
	
	const network = AVALANCHE_NETWORKS[CURRENT_NETWORK];

	try {
		// Try to switch to the network
		await provider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: network.chainId }]
		});
	} catch (switchError: any) {
		// This error code indicates that the chain has not been added to wallet
		if (switchError.code === 4902) {
			try {
				await provider.request({
					method: 'wallet_addEthereumChain',
					params: [network]
				});
			} catch (addError) {
				throw new Error(`Failed to add Avalanche network to ${walletType || 'wallet'}`);
			}
		} else {
			throw switchError;
		}
	}
}

/**
 * Connect to wallet (MetaMask or Core)
 */
export async function connectWallet(walletType: WalletType = 'metamask'): Promise<string> {
	// Check if wallet is installed
	if (walletType === 'metamask' && !isMetaMaskInstalled()) {
		throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
	}
	if (walletType === 'core' && !isCoreWalletInstalled()) {
		throw new Error('Core wallet is not installed. Please install Core wallet to continue.');
	}

	try {
		const provider = getWalletProvider(walletType);
		
		if (!provider) {
			throw new Error(`${walletType === 'core' ? 'Core wallet' : 'MetaMask'} provider not found`);
		}
		
		// Wallet compatibility fix - ensure provider is ready
		if (provider && provider.on) {
			// Remove any existing listeners to prevent duplicates
			try {
				provider.removeAllListeners?.();
			} catch (e) {
				// Ignore errors from removeAllListeners
			}
		}

		// Request account access with retry logic
		let accounts: string[] = [];
		let retries = 3;
		
		while (retries > 0 && accounts.length === 0) {
			try {
				accounts = await provider.request({ 
					method: 'eth_requestAccounts' 
				});
				break;
			} catch (err: any) {
				if (err.code === 4001) {
					// User rejected request
					throw new Error(`Please approve the connection request in ${walletType === 'core' ? 'Core wallet' : 'MetaMask'}`);
				}
				retries--;
				if (retries === 0) throw err;
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}
		
		if (!accounts || accounts.length === 0) {
			throw new Error('No accounts found');
		}

		const address = accounts[0];
		
		// Check network
		const correctNetwork = await isCorrectNetwork(provider);
		if (!correctNetwork) {
			await switchToAvalanche(walletType);
		}

		// Create provider with compatibility options
		let ethersProvider: ethers.BrowserProvider;
		let signer: ethers.Signer;
		
		try {
			// Use BrowserProvider with polling for better compatibility
			ethersProvider = new ethers.BrowserProvider(provider, 'any');
			signer = await ethersProvider.getSigner();
		} catch (providerError) {
			console.warn('Provider creation failed, retrying...', providerError);
			// Retry with a fresh provider instance
			await new Promise(resolve => setTimeout(resolve, 1000));
			ethersProvider = new ethers.BrowserProvider(provider, 'any');
			signer = await ethersProvider.getSigner();
		}

		// Get balance
		const balance = await ethersProvider.getBalance(address);
		const formattedBalance = ethers.formatEther(balance);
		const chainId = await getCurrentChainId(provider);

		// Update store
		walletStore.set({
			address,
			balance: formattedBalance,
			chainId,
			isConnected: true,
			isCorrectNetwork: true,
			provider: ethersProvider,
			signer,
			walletType
		});

		// Create or update user profile in Firestore
		await createOrUpdateUser(address, walletType);

		return address;
	} catch (error: any) {
		console.error('Error connecting wallet:', error);
		
		// Provide user-friendly error messages
		const walletName = walletType === 'core' ? 'Core wallet' : 'MetaMask';
		if (error.message?.includes('User rejected') || error.code === 4001) {
			throw new Error(`Please approve the connection request in ${walletName}`);
		} else if (error.message?.includes('addListener')) {
			throw new Error(`${walletName} compatibility issue. Please refresh the page and try again.`);
		} else {
			throw new Error(error.message || 'Failed to connect wallet. Please try again.');
		}
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
		signer: null,
		walletType: null
	});
	
	// Clear from localStorage
	if (typeof window !== 'undefined') {
		localStorage.removeItem('walletAddress');
		localStorage.removeItem('walletType');
	}
}

/**
 * Sign message for authentication
 */
export async function signMessage(message: string): Promise<string> {
	const wallet = get(walletStore);
	
	if (!wallet.signer) {
		throw new Error('No wallet connected');
	}
	
	return await wallet.signer.signMessage(message);
}

/**
 * Create or update user profile in Firestore
 */
async function createOrUpdateUser(address: string, walletType: WalletType): Promise<void> {
	const firestore = getFirebaseFirestore();
	const userRef = doc(firestore, 'users', address);
	
	// Check if user exists
	const userSnap = await getDoc(userRef);
	
	if (!userSnap.exists()) {
		// Create new user with starting balance
		await setDoc(userRef, {
			walletAddress: address,
			walletType,
			balance: 1000, // Starting balance
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			totalBets: 0,
			totalWinnings: 0
		});
		console.log('✅ Created user profile with 1000 credits');
	} else {
		// Update last login and wallet type
		await setDoc(userRef, {
			walletType,
			updatedAt: serverTimestamp()
		}, { merge: true });
		console.log('✅ Updated user profile');
	}
	
	// Save to localStorage for persistence
	if (typeof window !== 'undefined') {
		localStorage.setItem('walletAddress', address);
		localStorage.setItem('walletType', walletType);
	}
}

/**
 * Auto-connect if previously connected
 */
export async function autoConnectWallet(): Promise<boolean> {
	if (typeof window === 'undefined') return false;
	
	const savedAddress = localStorage.getItem('walletAddress');
	const savedWalletType = (localStorage.getItem('walletType') as WalletType) || 'metamask';
	
	if (!savedAddress) return false;
	
	// Check if the saved wallet type is installed
	if (savedWalletType === 'metamask' && !isMetaMaskInstalled()) return false;
	if (savedWalletType === 'core' && !isCoreWalletInstalled()) return false;

	try {
		const provider = getWalletProvider(savedWalletType);
		
		if (!provider) return false;
		
		// Give wallet time to initialize on page load
		await new Promise(resolve => setTimeout(resolve, 100));
		
		const accounts = await provider.request({ method: 'eth_accounts' });
		
		if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
			await connectWallet(savedWalletType);
			return true;
		}
	} catch (error) {
		console.error('Error auto-connecting wallet:', error);
		// Clear saved data if auto-connect fails
		localStorage.removeItem('walletAddress');
		localStorage.removeItem('walletType');
	}
	
	return false;
}

/**
 * Listen for account and network changes
 */
export function setupWalletListeners(): void {
	if (typeof window === 'undefined') return;
	
	// Setup listeners for both MetaMask and Core wallet
	const providers = [];
	
	if (isMetaMaskInstalled()) {
		const metamaskProvider = getWalletProvider('metamask');
		if (metamaskProvider) {
			providers.push({ type: 'metamask' as WalletType, provider: metamaskProvider });
		}
	}
	
	if (isCoreWalletInstalled()) {
		const coreProvider = getWalletProvider('core');
		if (coreProvider) {
			providers.push({ type: 'core' as WalletType, provider: coreProvider });
		}
	}
	
	providers.forEach(({ type, provider }) => {
		try {
			// Remove existing listeners first to prevent duplicates
			if (provider.removeAllListeners) {
				provider.removeAllListeners('accountsChanged');
				provider.removeAllListeners('chainChanged');
			}

			// Account changed
			if (provider.on) {
				provider.on('accountsChanged', async (accounts: string[]) => {
					const currentWallet = get(walletStore);
					
					// Only handle if this is the currently connected wallet
					if (currentWallet.walletType !== type) return;
					
					if (accounts.length === 0) {
						// User disconnected
						disconnectWallet();
					} else {
						// User switched account
						try {
							await connectWallet(type);
						} catch (error) {
							console.error('Error reconnecting wallet:', error);
							disconnectWallet();
						}
					}
				});

				// Network changed
				provider.on('chainChanged', async () => {
					// Reload page when network changes (recommended by wallet providers)
					window.location.reload();
				});
			}
		} catch (error) {
			console.error(`Error setting up ${type} listeners:`, error);
			// Continue even if listeners fail - don't block the app
		}
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

