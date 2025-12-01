/**
 * Seed Script for Bench Prediction Market
 * 
 * This script creates sample markets in Firestore for development/demo.
 * Run with: npx ts-node scripts/seed-data.ts
 * 
 * Prerequisites:
 * - Firebase Admin SDK credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
 * - Or run via Firebase emulators
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// For local development, set GOOGLE_APPLICATION_CREDENTIALS to your service account key
admin.initializeApp();

const db = admin.firestore();

interface SeedMarket {
	title: string;
	description: string;
	sport: string;
	closeAt: Date;
	options: { label: string; probability: number }[];
}

const sampleMarkets: SeedMarket[] = [
	{
		title: 'Who retires first, Ronaldo or Messi?',
		description: 'Predict which football legend will announce their retirement from professional football first.',
		sport: 'football',
		closeAt: new Date('2025-12-31'),
		options: [
			{ label: 'Ronaldo', probability: 0.55 },
			{ label: 'Messi', probability: 0.45 },
		],
	},
	{
		title: 'World Cup 2026 Winner',
		description: 'Which national team will lift the FIFA World Cup trophy in 2026?',
		sport: 'football',
		closeAt: new Date('2026-07-19'),
		options: [
			{ label: 'Brazil', probability: 0.18 },
			{ label: 'France', probability: 0.16 },
			{ label: 'Argentina', probability: 0.15 },
			{ label: 'England', probability: 0.12 },
			{ label: 'Spain', probability: 0.11 },
			{ label: 'Other', probability: 0.28 },
		],
	},
	{
		title: 'Premier League Top Scorer 2024/25',
		description: 'Who will win the Premier League Golden Boot this season?',
		sport: 'football',
		closeAt: new Date('2025-05-25'),
		options: [
			{ label: 'Haaland', probability: 0.45 },
			{ label: 'Salah', probability: 0.20 },
			{ label: 'Watkins', probability: 0.12 },
			{ label: 'Isak', probability: 0.10 },
			{ label: 'Other', probability: 0.13 },
		],
	},
	{
		title: 'Champions League Winner 2024/25',
		description: 'Which club will win the UEFA Champions League this season?',
		sport: 'football',
		closeAt: new Date('2025-05-31'),
		options: [
			{ label: 'Manchester City', probability: 0.22 },
			{ label: 'Real Madrid', probability: 0.20 },
			{ label: 'Bayern Munich', probability: 0.15 },
			{ label: 'Arsenal', probability: 0.12 },
			{ label: 'Barcelona', probability: 0.10 },
			{ label: 'Other', probability: 0.21 },
		],
	},
	{
		title: 'Will Mbappé score 30+ La Liga goals this season?',
		description: 'Predict if Kylian Mbappé will score 30 or more league goals in his first La Liga season.',
		sport: 'football',
		closeAt: new Date('2025-05-25'),
		options: [
			{ label: 'Yes (30+ goals)', probability: 0.35 },
			{ label: 'No (under 30)', probability: 0.65 },
		],
	},
];

async function seedMarkets() {
	console.log('Starting to seed markets...');

	for (const marketData of sampleMarkets) {
		// Create market document
		const marketRef = db.collection('markets').doc();
		
		await marketRef.set({
			title: marketData.title,
			description: marketData.description,
			sport: marketData.sport,
			status: 'open',
			resolution: null,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			closeAt: admin.firestore.Timestamp.fromDate(marketData.closeAt),
		});

		console.log(`Created market: ${marketData.title}`);

		// Create options subcollection
		const optionsRef = marketRef.collection('options');
		
		for (let i = 0; i < marketData.options.length; i++) {
			const option = marketData.options[i];
			await optionsRef.add({
				label: option.label,
				probability: option.probability,
				yesVolume: 0,
				noVolume: 0,
				order: i,
			});
		}

		console.log(`  Added ${marketData.options.length} options`);
	}

	console.log('Seeding complete!');
}

// Run the seed function
seedMarkets()
	.then(() => {
		console.log('Done!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Error seeding data:', error);
		process.exit(1);
	});


