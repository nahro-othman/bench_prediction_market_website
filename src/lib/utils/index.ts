/**
 * Utility Functions for Bench
 * 
 * General-purpose helpers used throughout the application.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Format a probability (0-1) as a percentage string
 * @param probability - Number between 0 and 1
 * @returns Formatted string like "25%"
 */
export function formatProbability(probability: number): string {
	return `${Math.round(probability * 100)}%`;
}

/**
 * Format a number as currency (demo credits)
 * @param amount - Amount to format
 * @returns Formatted string like "1,000"
 */
export function formatCredits(amount: number): string {
	return new Intl.NumberFormat('en-US').format(Math.round(amount));
}

/**
 * Format a Firestore Timestamp or Date as a readable string
 * @param timestamp - Firestore Timestamp or Date
 * @returns Formatted date string
 */
export function formatDate(timestamp: Timestamp | Date): string {
	const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(date);
}

/**
 * Format a Firestore Timestamp or Date as relative time
 * @param timestamp - Firestore Timestamp or Date
 * @returns Relative time string like "2 hours ago" or "in 3 days"
 */
export function formatRelativeTime(timestamp: Timestamp | Date): string {
	const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.round(diffMs / (1000 * 60 * 60));

	if (diffDays > 0) {
		return diffDays === 1 ? 'in 1 day' : `in ${diffDays} days`;
	} else if (diffDays < 0) {
		return diffDays === -1 ? '1 day ago' : `${Math.abs(diffDays)} days ago`;
	} else if (diffHours > 0) {
		return diffHours === 1 ? 'in 1 hour' : `in ${diffHours} hours`;
	} else if (diffHours < 0) {
		return diffHours === -1 ? '1 hour ago' : `${Math.abs(diffHours)} hours ago`;
	}
	return 'now';
}

/**
 * Calculate potential payout for a bet
 * Simple formula: stake * (1 / probability) for YES bets
 * For NO bets: stake * (1 / (1 - probability))
 * 
 * @param stake - Amount being bet
 * @param probability - Current probability of the option
 * @param side - "yes" or "no"
 * @returns Potential payout if bet wins
 */
export function calculatePotentialPayout(
	stake: number,
	probability: number,
	side: 'yes' | 'no'
): number {
	const effectiveProbability = side === 'yes' ? probability : 1 - probability;
	// Prevent division by zero or extremely high payouts
	const clampedProbability = Math.max(0.01, Math.min(0.99, effectiveProbability));
	return stake * (1 / clampedProbability);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Generate a simple unique ID (for client-side use only)
 */
export function generateId(): string {
	return Math.random().toString(36).substring(2, 15);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}


