/**
 * Firebase Configuration for SvelteFire
 * 
 * This module exports the Firebase configuration and initialized instances
 * for use with SvelteFire components.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID
} from '$env/static/public';

// Firebase configuration from environment variables
export const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID
};


// Initialize Firebase (singleton pattern)
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions;
let storage: FirebaseStorage;

function getFirebaseApp(): FirebaseApp {
	if (!firebaseApp) {
		const existingApps = getApps();
		firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
	}
	return firebaseApp;
}

export function getFirebaseAuth(): Auth {
	if (!auth) {
		auth = getAuth(getFirebaseApp());
	}
	return auth;
}

export function getFirebaseFirestore(): Firestore {
	if (!firestore) {
		firestore = getFirestore(getFirebaseApp());
	}
	return firestore;
}

export function getFirebaseFunctions(): Functions {
	if (!functions) {
		functions = getFunctions(getFirebaseApp());
	}
	return functions;
}

export function getFirebaseStorage(): FirebaseStorage {
	if (!storage) {
		storage = getStorage(getFirebaseApp());
	}
	return storage;
}

// Export initialized instances for SvelteFire
export { firebaseApp, auth, firestore, functions, storage };

// Helper function to upload to Firebase Storage
export async function uploadToFirebaseStorage(
	filePath: string,
	content: string,
	contentType: string
): Promise<string> {
	const storageInstance = getFirebaseStorage();
	const { ref, uploadString, getDownloadURL } = await import('firebase/storage');

	const storageRef = ref(storageInstance, filePath);

	// Upload the base64 string
	await uploadString(storageRef, content, 'data_url', {
		contentType
	});

	// Get the download URL
	const downloadURL = await getDownloadURL(storageRef);
	return downloadURL;
}


