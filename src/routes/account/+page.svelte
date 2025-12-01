<!--
  Account Page using SvelteFire
  
  Uses SvelteFire's SignedIn, User, Doc, and Collection components
  for reactive user data.
-->
<script lang="ts">
	import { SignedIn, SignedOut, User, Doc, Collection } from 'sveltefire';
	import { collection, query, where, orderBy } from 'firebase/firestore';
	import { getFirebaseFirestore } from '$lib/firebase';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { Position } from '$lib/types';

	const firestore = browser ? getFirebaseFirestore() : null;

	let activeTab = $state<'open' | 'settled'>('open');

	function formatCredits(amount: number): string {
		return new Intl.NumberFormat('en-US').format(Math.round(amount || 0));
	}

	function formatProbability(probability: number): string {
		return `${Math.round(probability * 100)}%`;
	}
</script>

<svelte:head>
	<title>My Account - Bench</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	{#if browser}
		<SignedOut>
			<div class="card text-center py-12">
				<h2 class="text-lg font-medium text-surface-900 mb-4">Please sign in to view your account</h2>
				<a href="/login" class="btn-primary">Log In</a>
			</div>
		</SignedOut>

		<SignedIn>
		<User let:user>
			<!-- Profile section -->
			<section class="card mb-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div class="flex items-center space-x-4">
						{#if user.photoURL}
							<img 
								src={user.photoURL} 
								alt="Profile" 
								class="w-16 h-16 rounded-full object-cover"
							/>
						{:else}
							<div class="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
								<span class="text-brand-700 font-bold text-2xl">
									{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
								</span>
							</div>
						{/if}
						<div>
							<h1 class="text-xl font-bold text-surface-900">
								{user.displayName || 'User'}
							</h1>
							<p class="text-surface-500">{user.email}</p>
						</div>
					</div>
					
					<!-- Balance from Firestore -->
					<Doc ref="users/{user.uid}" let:data={profile} let:loading>
						{#if loading}
							<div class="bg-surface-50 rounded-xl px-6 py-4 text-center sm:text-right animate-pulse">
								<div class="h-4 bg-surface-200 rounded w-16 mb-2"></div>
								<div class="h-8 bg-surface-200 rounded w-24"></div>
							</div>
						{:else if profile}
							<div class="bg-surface-50 rounded-xl px-6 py-4 text-center sm:text-right">
								<p class="text-sm text-surface-500 mb-1">Balance</p>
								<p class="text-3xl font-bold text-surface-900">{formatCredits(profile.balance)}</p>
								<p class="text-xs text-surface-400">credits</p>
							</div>
						{/if}
					</Doc>
				</div>
			</section>

			<!-- Positions section -->
			<section class="card">
				<h2 class="text-xl font-bold text-surface-900 mb-4">My Positions</h2>

				{#if browser && firestore}
					<!-- Get all positions for this user -->
					<Collection 
						ref={query(
							collection(firestore, 'positions'),
							where('userId', '==', user.uid),
							orderBy('createdAt', 'desc')
						)}
						let:data={positions}
						let:loading
					>
						{@const openPositions = positions?.filter((p: Position) => !p.settled) || []}
						{@const settledPositions = positions?.filter((p: Position) => p.settled) || []}

						<!-- Tabs -->
						<div class="flex space-x-1 bg-surface-100 p-1 rounded-lg mb-6">
							<button
								onclick={() => activeTab = 'open'}
								class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
									activeTab === 'open'
										? 'bg-white text-surface-900 shadow-sm'
										: 'text-surface-500 hover:text-surface-700'
								}`}
							>
								Open ({openPositions.length})
							</button>
							<button
								onclick={() => activeTab = 'settled'}
								class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
									activeTab === 'settled'
										? 'bg-white text-surface-900 shadow-sm'
										: 'text-surface-500 hover:text-surface-700'
								}`}
							>
								Settled ({settledPositions.length})
							</button>
						</div>

						{#if loading}
							<div class="space-y-3">
								{#each [1, 2, 3] as _}
									<div class="bg-surface-50 rounded-xl p-4 animate-pulse">
										<div class="h-5 bg-surface-200 rounded w-3/4 mb-2"></div>
										<div class="h-4 bg-surface-200 rounded w-1/2"></div>
									</div>
								{/each}
							</div>
						{:else if activeTab === 'open'}
							{#if openPositions.length === 0}
								<div class="text-center py-8">
									<svg class="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
									<p class="text-surface-500">No open positions</p>
									<a href="/" class="text-brand-600 hover:text-brand-700 font-medium text-sm mt-2 inline-block">
										Browse markets →
									</a>
								</div>
							{:else}
								<div class="space-y-3">
									{#each openPositions as position (position.id)}
										<div class="bg-surface-50 rounded-xl p-4">
											<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
												<div class="flex-1">
													<a href="/markets/{position.marketId}" class="text-surface-900 font-medium hover:text-brand-600">
														{position.marketTitle}
													</a>
													<div class="flex items-center space-x-2 mt-1">
														<span class="text-sm text-surface-600">{position.optionLabel}</span>
														<span class={`text-xs px-2 py-0.5 rounded-full font-medium ${
															position.side === 'yes'
																? 'bg-yes-light text-yes-dark'
																: 'bg-no-light text-no-dark'
														}`}>
															{position.side.toUpperCase()}
														</span>
													</div>
												</div>
												<div class="text-right">
													<p class="text-lg font-semibold text-surface-900">
														{formatCredits(position.stake)} credits
													</p>
													<p class="text-xs text-surface-400">
														at {formatProbability(position.probabilityAtBet)}
													</p>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{:else}
							{#if settledPositions.length === 0}
								<div class="text-center py-8">
									<svg class="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<p class="text-surface-500">No settled positions yet</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each settledPositions as position (position.id)}
										<div class="bg-surface-50 rounded-xl p-4">
											<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
												<div class="flex-1">
													<p class="text-surface-900 font-medium">
														{position.marketTitle}
													</p>
													<div class="flex items-center space-x-2 mt-1">
														<span class="text-sm text-surface-600">{position.optionLabel}</span>
														<span class={`text-xs px-2 py-0.5 rounded-full font-medium ${
															position.side === 'yes'
																? 'bg-yes-light text-yes-dark'
																: 'bg-no-light text-no-dark'
														}`}>
															{position.side.toUpperCase()}
														</span>
													</div>
												</div>
												<div class="text-right">
													<p class={`text-lg font-semibold ${
														(position.payout ?? 0) > 0 ? 'text-yes' : 'text-surface-400'
													}`}>
														{(position.payout ?? 0) > 0 
															? `+${formatCredits(position.payout! - position.stake)}` 
															: `-${formatCredits(position.stake)}`}
													</p>
													<p class="text-xs text-surface-400">
														{(position.payout ?? 0) > 0 ? 'Won' : 'Lost'}
													</p>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</Collection>
				{/if}
			</section>
		</User>
		</SignedIn>
	{:else}
		<!-- SSR fallback -->
		<div class="card animate-pulse">
			<div class="h-16 bg-surface-200 rounded w-16 mb-4"></div>
			<div class="h-6 bg-surface-200 rounded w-1/3 mb-2"></div>
			<div class="h-4 bg-surface-200 rounded w-1/4"></div>
		</div>
	{/if}
</div>
