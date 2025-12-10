/**
 * Application Configuration
 * 
 * Centralized config for contract addresses and network settings
 * Using direct values since SvelteKit env vars aren't loading properly
 */

// Smart Contract Addresses (Avalanche Fuji Testnet)
// Deployed: Dec 7, 2025
export const CONTRACT_ADDRESSES = {
	PREDICTION_MARKET: '0xc727DE7b10a17813062E97887cb255C327E21a63',
	X402_PAYMENT: '0x373b28AB892fbA54743Cb033821d7582Cd6422ec',
	TOKEN: '0xd68a37901304749F46C63F9b20B86eC7bbE93F5C'
};

// Network Configuration
export const NETWORK_CONFIG = {
	CHAIN_ID: 43113, // Avalanche Fuji Testnet
	RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
	NETWORK_NAME: 'Avalanche Fuji Testnet',
	CURRENCY_SYMBOL: 'AVAX',
	BLOCK_EXPLORER: 'https://testnet.snowtrace.io'
};

// Check if contracts are deployed
export const CONTRACTS_DEPLOYED = !!CONTRACT_ADDRESSES.PREDICTION_MARKET;

console.log('🔧 Config loaded:', {
	CONTRACTS_DEPLOYED,
	PREDICTION_MARKET: CONTRACT_ADDRESSES.PREDICTION_MARKET,
	NETWORK: NETWORK_CONFIG.NETWORK_NAME
});





