<!--
  MarketCard Component
  
  Displays a market with its options in a card format.
  Used on the home page to show all open markets.
  
  Props:
  - market: MarketWithOptions data
  - onBet: Optional callback when user wants to bet
  - showLink: Whether to link to the market detail page
-->
<script lang="ts">
	import type { MarketWithOptions, BetSide } from '$lib/types';
	import { formatRelativeTime } from '$lib/utils';
	import OptionRow from './OptionRow.svelte';

	interface Props {
		market: MarketWithOptions;
		onBet?: (marketId: string, optionId: string, side: BetSide) => void;
		showLink?: boolean;
		disabled?: boolean;
	}

	let { market, onBet, showLink = true, disabled = false }: Props = $props();

	function handleBet(optionId: string, side: BetSide) {
		onBet?.(market.id, optionId, side);
	}

	// Calculate if market is still open for betting
	const isOpen = $derived(
		market.status === 'open' && 
		market.closeAt.toDate() > new Date()
	);
</script>

<article class="card hover:shadow-card-hover transition-shadow duration-200">
	<!-- Market header -->
	<header class="mb-4">
		{#if showLink}
			<a href="/markets/{market.id}" class="block group">
				<h3 class="text-lg font-semibold text-surface-900 group-hover:text-brand-600 transition-colors">
					{market.title}
				</h3>
			</a>
		{:else}
			<h3 class="text-lg font-semibold text-surface-900">
				{market.title}
			</h3>
		{/if}
		
		{#if market.description}
			<p class="text-sm text-surface-500 mt-1 line-clamp-2">
				{market.description}
			</p>
		{/if}

		<!-- Market meta info -->
		<div class="flex items-center space-x-4 mt-2 text-xs text-surface-400">
			<span class="flex items-center space-x-1">
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>Closes {formatRelativeTime(market.closeAt)}</span>
			</span>
			<span class="px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 capitalize">
				{market.sport}
			</span>
			{#if !isOpen}
				<span class="px-2 py-0.5 rounded-full bg-no-light text-no-dark font-medium">
					{market.status === 'settled' ? 'Settled' : 'Closed'}
				</span>
			{/if}
		</div>
	</header>

	<!-- Options list -->
	<div class="divide-y divide-surface-100">
		{#each market.options as option (option.id)}
			<OptionRow 
				{option} 
				onBet={handleBet}
				disabled={disabled || !isOpen}
			/>
		{/each}
	</div>

	<!-- Optional footer link -->
	{#if showLink}
		<footer class="mt-4 pt-4 border-t border-surface-100">
			<a 
				href="/markets/{market.id}" 
				class="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center space-x-1"
			>
				<span>View details</span>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</footer>
	{/if}
</article>


