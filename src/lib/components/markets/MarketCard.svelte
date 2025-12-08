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
  import type { MarketWithOptions, BetSide } from "$lib/types";
  import { formatRelativeTime } from "$lib/utils";
  import OptionRow from "./OptionRow.svelte";

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
    market.status === "open" && market.closeAt.toDate() > new Date()
  );

  // Get top 2 options by probability
  const topOptions = $derived(
    [...market.options]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 2)
  );
</script>

<article
  class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-surface-200"
>
  <!-- Market header -->
  <div class="p-5">
    {#if showLink}
      <a href="/markets/{market.id}" class="block group">
        <h3
          class="text-lg font-bold text-surface-900 group-hover:text-brand-600 transition-colors mb-2"
        >
          {market.title}
        </h3>
      </a>
    {:else}
      <h3 class="text-lg font-bold text-surface-900 mb-2">
        {market.title}
      </h3>
    {/if}

    <!-- Market meta info -->
    <div class="flex items-center gap-2 text-xs text-surface-500 mb-4">
      <span>Closes {formatRelativeTime(market.closeAt)}</span>
      {#if !isOpen}
        <span>•</span>
        <span class="text-red-600 font-semibold"
          >{market.status === "settled" ? "Settled" : "Closed"}</span
        >
      {/if}
    </div>

    <!-- Top 2 Options -->
    <div class="space-y-2">
      {#each topOptions as option, index (option.id)}
        <OptionRow
          {option}
          onBet={handleBet}
          disabled={disabled || !isOpen}
          {index}
        />
      {/each}
    </div>

    <!-- View more link -->
    {#if showLink && market.options.length > 2}
      <a
        href="/markets/{market.id}"
        class="inline-flex items-center mt-3 text-sm text-surface-600 hover:text-brand-600 font-medium group"
      >
        <span>+{market.options.length - 2} more options</span>
        <svg
          class="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </a>
    {/if}
  </div>
</article>
