<!--
  Home Page using SvelteFire
  
  Uses SvelteFire's Collection component for real-time market data.
-->
<script lang="ts">
  import { Collection, SignedIn, SignedOut, User, Doc } from "sveltefire";
  import { collection, query, where, orderBy } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { browser } from "$app/environment";
  import { MarketCard, BetDialog } from "$lib/components";
  import { placeBet } from "$lib/services/bets";
  import type { MarketWithOptions, MarketOption, BetSide } from "$lib/types";

  // Get Firestore reference
  const firestore = browser ? getFirebaseFirestore() : null;

  // Bet dialog state
  let isBetDialogOpen = $state(false);
  let selectedMarket = $state<MarketWithOptions | null>(null);
  let selectedOption = $state<MarketOption | null>(null);
  let selectedSide = $state<BetSide>("yes");
  let betLoading = $state(false);
  let betError = $state("");
  let userBalance = $state(0);

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
  <section class="text-center mb-12">
    <h1 class="text-4xl sm:text-5xl font-bold text-surface-900 mb-4">
      Football Prediction Market
    </h1>
    <p class="text-lg text-surface-500 max-w-2xl mx-auto">
      Will Ronaldo retire before Messi? Who wins the World Cup 2026? Place your
      predictions and compete for bragging rights.
    </p>
    {#if browser}
      <SignedOut>
        <div class="mt-6 flex justify-center space-x-4">
          <a href="/signup" class="btn-primary"> Get Started Free </a>
          <a href="/login" class="btn-secondary"> Log In </a>
        </div>
      </SignedOut>
    {:else}
      <!-- SSR fallback: show auth buttons -->
      <div class="mt-6 flex justify-center space-x-4">
        <a href="/signup" class="btn-primary"> Get Started Free </a>
        <a href="/login" class="btn-secondary"> Log In </a>
      </div>
    {/if}
  </section>

  <!-- Markets section -->
  <section>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-surface-900">Open Markets</h2>
    </div>

    {#if browser && firestore}
      <Collection
        ref={query(
          collection(firestore, "markets"),
          where("status", "==", "open"),
          orderBy("createdAt", "desc")
        )}
        let:data={markets}
        let:loading
      >
        {#if loading}
          <!-- Loading state -->
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each [1, 2, 3] as _}
              <div class="card animate-pulse">
                <div class="h-6 bg-surface-200 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-surface-200 rounded w-1/2 mb-6"></div>
                <div class="space-y-4">
                  {#each [1, 2] as __}
                    <div class="flex items-center justify-between py-3">
                      <div class="h-5 bg-surface-200 rounded w-24"></div>
                      <div class="h-6 bg-surface-200 rounded w-12"></div>
                      <div class="flex flex-col space-y-1">
                        <div class="h-7 bg-surface-200 rounded w-14"></div>
                        <div class="h-7 bg-surface-200 rounded w-14"></div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {:else if markets.length === 0}
          <!-- Empty state -->
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 class="text-lg font-medium text-surface-900 mb-2">
              No markets available
            </h3>
            <p class="text-surface-500">
              Check back soon for new prediction markets!
            </p>
          </div>
        {:else}
          <!-- Markets grid with options loaded -->
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each markets as market (market.id)}
              <!-- Load options for each market -->
              <Collection
                ref={collection(firestore, "markets", market.id, "options")}
                let:data={options}
              >
                {@const marketWithOptions = {
                  ...market,
                  options: options || [],
                }}
                <SignedIn>
                  <User let:user>
                    <Doc ref="users/{user.uid}" let:data={profile}>
                      <MarketCard
                        market={marketWithOptions}
                        onBet={(mId, oId, side) => {
                          userBalance = profile?.balance || 0;
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
                    </Doc>
                  </User>
                </SignedIn>
                <SignedOut>
                  <MarketCard
                    market={marketWithOptions}
                    onBet={() => (window.location.href = "/login")}
                    disabled={true}
                  />
                </SignedOut>
              </Collection>
            {/each}
          </div>
        {/if}
      </Collection>
    {:else}
      <!-- SSR fallback -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each [1, 2, 3] as _}
          <div class="card animate-pulse">
            <div class="h-6 bg-surface-200 rounded w-3/4 mb-4"></div>
            <div class="h-4 bg-surface-200 rounded w-1/2 mb-6"></div>
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
  balance={userBalance}
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
