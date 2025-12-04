/// <reference types="vite/client" />

/**
 * Environment Variable Types
 * 
 * Provides TypeScript types for environment variables.
 * Variables prefixed with PUBLIC_ are available client-side.
 */
interface ImportMetaEnv {
	readonly PUBLIC_FIREBASE_API_KEY: string;
	readonly PUBLIC_FIREBASE_AUTH_DOMAIN: string;
	readonly PUBLIC_FIREBASE_PROJECT_ID: string;
	readonly PUBLIC_FIREBASE_STORAGE_BUCKET: string;
	readonly PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
	readonly PUBLIC_FIREBASE_APP_ID: string;
	readonly PUBLIC_AVALANCHE_RPC_URL: string;
	readonly PUBLIC_CHAIN_ID: string;
	readonly PUBLIC_PREDICTION_MARKET_CONTRACT: string;
	readonly PUBLIC_X402_PAYMENT_CONTRACT: string;
	readonly PUBLIC_ERC8004_TOKEN_CONTRACT: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}


