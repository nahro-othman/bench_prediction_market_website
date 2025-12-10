<!--
  Market Detail Page using SvelteFire
  
  Uses SvelteFire's Doc and Collection components for real-time market data.
-->
<script lang="ts">
  import { page } from "$app/stores";
  import { Doc, Collection } from "sveltefire";
  import { collection } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { browser } from "$app/environment";
  import {
    OptionRow,
    BetDialog,
    BettingActivityChart,
    EvidenceUpload,
    WalletConnectDialog,
  } from "$lib/components";
  import { placeBet } from "$lib/services/bets";
  import { walletStore } from "$lib/services/web3/auth";
  import type { MarketOption, BetSide } from "$lib/types";

  const firestore = browser ? getFirebaseFirestore() : null;
  const marketId = $page.params.id;

  // Bet dialog state
  let isBetDialogOpen = $state(false);
  let selectedOption = $state<MarketOption | null>(null);
  let selectedSide = $state<BetSide>("yes");
  let betLoading = $state(false);
  let betError = $state("");
  let betSuccess = $state("");
  let currentMarket = $state<any>(null);
  let currentOptions = $state<any[]>([]);

  // Wallet connect dialog state
  let showWalletDialog = $state(false);

  function formatDate(timestamp: any): string {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatRelativeTime(timestamp: any): string {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return diffDays === 1 ? "in 1 day" : `in ${diffDays} days`;
    } else if (diffDays < 0) {
      return diffDays === -1 ? "1 day ago" : `${Math.abs(diffDays)} days ago`;
    }
    return "today";
  }

  function formatProbability(probability: number): string {
    return `${Math.round(probability * 100)}%`;
  }

  function isMarketOpen(market: any): boolean {
    if (!market || market.status !== "open") return false;
    const closeAt = market.closeAt?.toDate
      ? market.closeAt.toDate()
      : new Date(market.closeAt);
    return closeAt > new Date();
  }

  function handleBet(optionId: string, side: BetSide, options: MarketOption[]) {
    const option = options.find((o) => o.id === optionId);
    if (option) {
      selectedOption = option;
      selectedSide = side;
      betError = "";
      isBetDialogOpen = true;
    }
  }

  async function handleConfirmBet(stake: number) {
    if (!selectedOption) return;

    betLoading = true;
    betError = "";
    betSuccess = "";

    console.log("🎲 Attempting to place bet:", {
      marketId,
      optionId: selectedOption.id,
      side: selectedSide,
      stake,
    });

    const result = await placeBet(
      marketId,
      selectedOption.id,
      selectedSide,
      stake
    );

    console.log("📊 Bet result:", result);

    betLoading = false;

    if (result.success) {
      console.log("✅ Bet placed successfully!");
      betSuccess = result.message || "Bet placed successfully!";
      isBetDialogOpen = false;
      selectedOption = null;

      // Clear success message after 5 seconds
      setTimeout(() => {
        betSuccess = "";
      }, 5000);
    } else {
      console.error("❌ Bet failed:", result.error);
      betError = result.error || "Failed to place bet";

      // Clear error after 5 seconds
      setTimeout(() => {
        betError = "";
      }, 5000);
    }
  }

  function handleCloseBetDialog() {
    isBetDialogOpen = false;
    selectedOption = null;
    betError = "";
    betSuccess = "";
  }
</script>

<svelte:head>
  <title>{currentMarket?.title || "Market"} - Bench</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Back link -->
  <a
    href="/"
    class="inline-flex items-center text-sm text-surface-500 hover:text-surface-700 mb-6"
  >
    <svg
      class="w-4 h-4 mr-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 19l-7-7 7-7"
      />
    </svg>
    Back to markets
  </a>

  {#if browser && firestore}
    <Doc ref="markets/{marketId}" let:data={market} let:loading let:error>
      {#if loading}
        <!-- Loading state -->
        <div class="card animate-pulse">
          <div class="h-8 bg-surface-200 rounded w-3/4 mb-4"></div>
          <div class="h-4 bg-surface-200 rounded w-1/2 mb-8"></div>
          <div class="space-y-4">
            {#each [1, 2, 3] as _}
              <div
                class="flex items-center justify-between py-4 border-b border-surface-100"
              >
                <div class="h-5 bg-surface-200 rounded w-32"></div>
                <div class="h-8 bg-surface-200 rounded w-16"></div>
              </div>
            {/each}
          </div>
        </div>
      {:else if error || !market}
        <!-- Error state -->
        <div class="card text-center py-12">
          <svg
            class="w-16 h-16 mx-auto text-surface-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            />
          </svg>
          <h2 class="text-lg font-medium text-surface-900 mb-2">
            Market not found
          </h2>
          <p class="text-surface-500 mb-4">
            This market may have been removed or doesn't exist.
          </p>
          <a href="/" class="btn-primary">Browse Markets</a>
        </div>
      {:else}
        {@const _ = currentMarket = market}
        {@const isOpen = isMarketOpen(market)}

        <!-- Market header -->
        <header class="card mb-6">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-surface-900">
                {market.title}
              </h1>
              {#if market.description}
                <p class="text-surface-500 mt-2">
                  {market.description}
                </p>
              {/if}
            </div>
            <span
              class={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
                isOpen
                  ? "bg-yes-light text-yes-dark"
                  : market.status === "settled"
                    ? "bg-surface-200 text-surface-600"
                    : "bg-no-light text-no-dark"
              }`}
            >
              {isOpen
                ? "Open"
                : market.status === "settled"
                  ? "Settled"
                  : "Closed"}
            </span>
          </div>

          <!-- Meta info -->
          <div class="flex flex-wrap gap-4 text-sm text-surface-500">
            <div class="flex items-center space-x-1">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Closes {formatRelativeTime(market.closeAt)}</span>
            </div>
            <div class="flex items-center space-x-1">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Created {formatDate(market.createdAt)}</span>
            </div>
          </div>
        </header>

        <!-- Options -->
        <section class="card">
          <h2 class="text-lg font-semibold text-surface-900 mb-4">Options</h2>

          {#if browser && !$walletStore.isConnected}
            <div class="bg-brand-50 rounded-xl p-4 mb-4">
              <p class="text-sm text-brand-700">
                <button
                  onclick={() => (showWalletDialog = true)}
                  class="font-medium underline hover:text-brand-800"
                  >Connect wallet</button
                > to place bets on this market.
              </p>
            </div>
          {:else if !browser}
            <div class="bg-brand-50 rounded-xl p-4 mb-4">
              <p class="text-sm text-brand-700">
                <button
                  onclick={() => (showWalletDialog = true)}
                  class="font-medium underline hover:text-brand-800"
                  >Connect wallet</button
                > to place bets on this market.
              </p>
            </div>
          {/if}

          <!-- Load options -->
          <Collection
            ref={collection(firestore, "markets", marketId, "options")}
            let:data={options}
          >
            {@const sortedOptions = [...(options || [])].sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            )}

            <div class="divide-y divide-surface-100">
              {#each sortedOptions as option (option.id)}
                {#if browser && $walletStore.isConnected}
                  <OptionRow
                    option={{ ...option, marketId }}
                    onBet={(optionId, side) => {
                      handleBet(
                        optionId,
                        side,
                        sortedOptions.map((o) => ({ ...o, marketId }))
                      );
                    }}
                    disabled={!isOpen}
                  />
                {:else}
                  <OptionRow
                    option={{ ...option, marketId }}
                    onBet={() => {}}
                    disabled={true}
                  />
                {/if}
              {/each}
            </div>
          </Collection>
        </section>

        <!-- Betting Activity Chart -->
        {#if browser}
          <Collection
            ref={collection(firestore, "markets", marketId, "options")}
            let:data={options}
          >
            <section class="mt-6">
              <BettingActivityChart {marketId} options={options || []} />
            </section>
          </Collection>
        {/if}

        <!-- Evidence Upload (for participants only) -->
        {#if browser}
          <section class="mt-6">
            <EvidenceUpload {marketId} marketTitle={market.title} />
          </section>
        {/if}

        <!-- Resolution info for settled markets -->
        {#if market.status === "settled" && market.resolution}
          <Collection
            ref={collection(firestore, "markets", marketId, "options")}
            let:data={options}
          >
            {@const winningOption = options?.find(
              (o) => o.id === market.resolution
            )}
            <section class="card mt-6 bg-surface-50">
              <h2 class="text-lg font-semibold text-surface-900 mb-2">
                Resolution
              </h2>
              <p class="text-surface-600">
                This market was settled. Winning option:
                <span class="font-medium text-surface-900">
                  {winningOption?.label || "Unknown"}
                </span>
              </p>
            </section>
          </Collection>
        {/if}
      {/if}
    </Doc>
  {:else}
    <!-- SSR fallback -->
    <div class="card animate-pulse">
      <div class="h-8 bg-surface-200 rounded w-3/4 mb-4"></div>
      <div class="h-4 bg-surface-200 rounded w-1/2"></div>
    </div>
  {/if}
</div>

<!-- Bet dialog -->
<BetDialog
  isOpen={isBetDialogOpen}
  market={currentMarket ? { ...currentMarket, options: [] } : null}
  option={selectedOption}
  side={selectedSide}
  balance={parseFloat($walletStore.balance || "0")}
  onConfirm={handleConfirmBet}
  onClose={handleCloseBetDialog}
  loading={betLoading}
/>

<!-- Success/Error notifications -->
{#if betError}
  <div
    class="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md animate-slide-in"
  >
    <div class="flex items-start gap-3">
      <svg
        class="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        <p class="font-semibold">Error placing bet</p>
        <p class="text-sm opacity-90">{betError}</p>
      </div>
    </div>
  </div>
{/if}

{#if betSuccess}
  <div
    class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md animate-slide-in"
  >
    <div class="flex items-start gap-3">
      <svg
        class="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        <p class="font-semibold">Bet placed successfully!</p>
        <p class="text-sm opacity-90">{betSuccess}</p>
      </div>
    </div>
  </div>
{/if}

<!-- Wallet Connect Dialog -->
<WalletConnectDialog
  bind:isOpen={showWalletDialog}
  onClose={() => (showWalletDialog = false)}
/>

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>
