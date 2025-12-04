<!--
  Home Page with Wallet Authentication
  
  Uses wallet connection for authentication and Firestore for real-time market data.
-->
<script lang="ts">
  import { Collection, Doc } from "sveltefire";
  import { collection, query, where, orderBy, doc } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { browser } from "$app/environment";
  import { MarketCard, BetDialog } from "$lib/components";
  import { placeBet } from "$lib/services/bets";
  import type { MarketWithOptions, MarketOption, BetSide } from "$lib/types";
  import { walletStore } from "$lib/services/web3/auth";

  // Get Firestore reference
  const firestore = browser ? getFirebaseFirestore() : null;

  // Category filter state
  type CategoryFilter = "all" | "games" | "futures" | "events";
  let selectedCategory = $state<CategoryFilter>("all");

  const categories: {
    id: CategoryFilter;
    label: string;
    icon: string;
    description: string;
  }[] = [
    {
      id: "all",
      label: "All Markets",
      icon: "📊",
      description: "Browse all prediction markets",
    },
    {
      id: "games",
      label: "Games",
      icon: "⚽",
      description: "Match predictions (Win/Draw/Lose)",
    },
    {
      id: "futures",
      label: "Futures",
      icon: "🏆",
      description: "Season & tournament winners",
    },
    {
      id: "events",
      label: "Events",
      icon: "❓",
      description: "Yes/No predictions",
    },
  ];

  // Filter markets by category
  function filterByCategory(markets: any[]): any[] {
    if (selectedCategory === "all") return markets;
    return markets.filter((m) => m.category === selectedCategory);
  }

  // Bet dialog state
  let isBetDialogOpen = $state(false);
  let selectedMarket = $state<MarketWithOptions | null>(null);
  let selectedOption = $state<MarketOption | null>(null);
  let selectedSide = $state<BetSide>("yes");
  let betLoading = $state(false);
  let betError = $state("");

  function handleBet(
    marketId: string,
    optionId: string,
    side: BetSide,
    markets: any[]
  ) {
    const market = markets.find((m: any) => m.id === marketId);
    const option = market?.options?.find((o: any) => o.id === optionId);

    if (market && option) {
      selectedMarket = { ...market, options: market.options || [] };
      selectedOption = option;
      selectedSide = side;
      betError = "";
      isBetDialogOpen = true;
    }
  }

  async function handleConfirmBet(stake: number) {
    if (!selectedMarket || !selectedOption) return;

    betLoading = true;
    betError = "";

    const result = await placeBet(
      selectedMarket.id,
      selectedOption.id,
      selectedSide,
      stake
    );

    betLoading = false;

    if (result.success) {
      isBetDialogOpen = false;
      selectedMarket = null;
      selectedOption = null;
    } else {
      betError = result.error || "Failed to place bet";
    }
  }

  function handleCloseBetDialog() {
    isBetDialogOpen = false;
    selectedMarket = null;
    selectedOption = null;
    betError = "";
  }
</script>

<svelte:head>
  <title>Bench - Football Prediction Market</title>
  <meta
    name="description"
    content="Predict football outcomes and compete with friends. Browse markets for World Cup, Premier League, and more."
  />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Hero section -->
  <section class="text-center mb-16">
    <div
      class="inline-block px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-4"
    >
      ⚽ Live Football Predictions
    </div>
    <h1
      class="text-4xl sm:text-6xl font-black text-surface-900 mb-6 leading-tight"
    >
      Predict. Compete. Win.
    </h1>
    <p class="text-xl text-surface-600 max-w-3xl mx-auto leading-relaxed">
      Will Ronaldo retire before Messi? Who wins the World Cup 2026? Place your
      predictions and compete for bragging rights.
    </p>
    {#if browser && !$walletStore.isConnected}
      <div class="mt-6 flex justify-center space-x-4">
        <a
          href="/login"
          class="btn bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Connect Wallet to Start
        </a>
      </div>
    {:else if !browser}
      <!-- SSR fallback: show connect button -->
      <div class="mt-6 flex justify-center space-x-4">
        <a href="/login" class="btn-primary"> Connect Wallet </a>
      </div>
    {/if}
  </section>

  <!-- Markets section -->
  <section>
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <h2 class="text-3xl font-black text-surface-900">🔥 Open Markets</h2>
    </div>

    <!-- Category Filter Tabs -->
    <div class="mb-8">
      <div class="flex flex-wrap gap-2 sm:gap-3">
        {#each categories as category}
          <button
            onclick={() => (selectedCategory = category.id)}
            class={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              selectedCategory === category.id
                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/25"
                : "bg-white text-surface-600 hover:bg-surface-50 border border-surface-200 hover:border-surface-300"
            }`}
          >
            <span class="text-lg">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        {/each}
      </div>
      <!-- Category description -->
      <p class="mt-3 text-sm text-surface-500">
        {categories.find((c) => c.id === selectedCategory)?.description}
      </p>
    </div>

    {#if browser && firestore}
      <Collection
        ref={query(
          collection(firestore, "markets"),
          where("status", "==", "open"),
          orderBy("createdAt", "desc")
        )}
        let:data={markets}
      >
        {@const filteredMarkets = filterByCategory(markets)}
        {#if filteredMarkets.length === 0}
          <!-- Empty state for filtered results -->
          <div
            class="bg-white rounded-xl shadow-lg text-center py-16 px-6 border border-surface-100"
          >
            <div class="max-w-md mx-auto">
              <div
                class="w-20 h-20 mx-auto mb-6 bg-surface-100 rounded-full flex items-center justify-center"
              >
                <svg
                  class="w-10 h-10 text-surface-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-surface-900 mb-3">
                No {selectedCategory === "all" ? "" : selectedCategory} markets available
              </h3>
              <p class="text-surface-600 text-lg">
                {#if selectedCategory !== "all"}
                  Try selecting a different category or check back later.
                {:else}
                  Check back soon for new prediction markets!
                {/if}
              </p>
            </div>
          </div>
        {:else}
          <!-- Markets grid with options loaded -->
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each filteredMarkets as market (market.id)}
              <!-- Load options for each market -->
              <Collection
                ref={collection(firestore, "markets", market.id, "options")}
                let:data={options}
              >
                {@const marketWithOptions = {
                  ...market,
                  options: options || [],
                }}
                {#if $walletStore.isConnected && $walletStore.address}
                  <MarketCard
                    market={marketWithOptions}
                    onBet={(mId, oId, side) => {
                      handleBet(
                        mId,
                        oId,
                        side,
                        markets.map((m) =>
                          m.id === market.id ? marketWithOptions : m
                        )
                      );
                    }}
                    disabled={false}
                  />
                {:else}
                  <MarketCard
                    market={marketWithOptions}
                    onBet={() => (window.location.href = "/login")}
                    disabled={true}
                  />
                {/if}
              </Collection>
            {/each}
          </div>
        {/if}
      </Collection>
    {:else}
      <!-- SSR fallback -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each [1, 2, 3, 4, 5, 6] as _}
          <div
            class="bg-white rounded-lg shadow-md animate-pulse overflow-hidden"
          >
            <div class="p-5">
              <div class="h-6 bg-surface-200 rounded w-3/4 mb-3"></div>
              <div class="h-3 bg-surface-200 rounded w-1/2 mb-4"></div>
              <div class="space-y-2">
                {#each [1, 2] as __}
                  <div class="bg-surface-50 rounded-lg p-3">
                    <div class="h-4 bg-surface-200 rounded w-24"></div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- How it works section -->
  <section class="mt-16 py-12 border-t border-surface-200">
    <h2 class="text-2xl font-bold text-surface-900 text-center mb-8">
      How It Works
    </h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="text-center">
        <div
          class="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">🎯</span>
        </div>
        <h3 class="font-semibold text-surface-900 mb-2">Pick a Market</h3>
        <p class="text-sm text-surface-500">
          Browse prediction markets about football events, players, and
          tournaments.
        </p>
      </div>
      <div class="text-center">
        <div
          class="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">💰</span>
        </div>
        <h3 class="font-semibold text-surface-900 mb-2">Place Your Bet</h3>
        <p class="text-sm text-surface-500">
          Bet YES or NO on outcomes. Higher risk = higher potential reward.
        </p>
      </div>
      <div class="text-center">
        <div
          class="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">🏆</span>
        </div>
        <h3 class="font-semibold text-surface-900 mb-2">Win Credits</h3>
        <p class="text-sm text-surface-500">
          Correct predictions earn you credits. Compete on the leaderboard!
        </p>
      </div>
    </div>
  </section>
</div>

<!-- Bet dialog -->
<BetDialog
  isOpen={isBetDialogOpen}
  market={selectedMarket}
  option={selectedOption}
  side={selectedSide}
  balance={parseFloat($walletStore.balance || '0')}
  onConfirm={handleConfirmBet}
  onClose={handleCloseBetDialog}
  loading={betLoading}
/>

{#if betError}
  <!-- Error toast -->
  <div
    class="fixed bottom-4 right-4 bg-no text-white px-6 py-3 rounded-lg shadow-lg z-50"
  >
    {betError}
  </div>
{/if}
