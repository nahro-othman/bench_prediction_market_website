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
  <!-- Markets section -->
  <section>
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    ></div>

    {#if browser && firestore}
      <Collection
        ref={query(
          collection(firestore, "markets"),
          where("status", "==", "open"),
          orderBy("createdAt", "desc")
        )}
        let:data={markets}
      >
        {#if markets.length === 0}
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
                No markets available
              </h3>
              <p class="text-surface-600 text-lg">
                Check back soon for new prediction markets!
              </p>
            </div>
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
</div>

<!-- Bet dialog -->
<BetDialog
  isOpen={isBetDialogOpen}
  market={selectedMarket}
  option={selectedOption}
  side={selectedSide}
  balance={parseFloat($walletStore.balance || "0")}
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
