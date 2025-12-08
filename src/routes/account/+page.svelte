<!--
  Account Page with Wallet Authentication
  
  Shows user's wallet info and betting positions
-->
<script lang="ts">
  import { Doc, Collection } from "sveltefire";
  import { collection, query, where, orderBy } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import type { Position } from "$lib/types";
  import { walletStore } from "$lib/services/web3/auth";

  const firestore = browser ? getFirebaseFirestore() : null;

  let activeTab = $state<"open" | "settled">("open");

  function formatProbability(probability: number): string {
    return `${Math.round(probability * 100)}%`;
  }

  function formatAVAX(amount: string | null): string {
    if (!amount) return "0.00";
    return parseFloat(amount).toFixed(2);
  }

  function formatCredits(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  }
</script>

<svelte:head>
  <title>My Account - Bench</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if browser}
    {#if !$walletStore.isConnected}
      <div class="card text-center py-12">
        <div
          class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 class="text-lg font-medium text-surface-900 mb-2">
          Connect Your Wallet
        </h2>
        <p class="text-surface-600 mb-6">
          Please connect your wallet to view your account
        </p>
        <a
          href="/login"
          class="btn bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-8 py-3 rounded-lg font-bold"
          >Connect Wallet</a
        >
      </div>
    {:else if $walletStore.address}
      <!-- Profile section -->
      <section class="card mb-6">
        <div class="flex items-center space-x-4">
          <div
            class="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h1 class="text-xl font-bold text-surface-900">My Wallet</h1>
            <p class="text-surface-500 font-mono text-sm">
              {$walletStore.address}
            </p>
            <div class="flex items-center gap-2 mt-2">
              <div
                class="bg-orange-50 px-3 py-1 rounded-lg border border-orange-200"
              >
                <span class="text-sm font-bold text-orange-900"
                  >{formatAVAX($walletStore.balance)} AVAX</span
                >
              </div>
              <span class="text-xs text-surface-500">balance</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Positions section -->
      <section class="card">
        <h2 class="text-xl font-bold text-surface-900 mb-4">My Positions</h2>

        {#if browser && firestore}
          <!-- Get all positions for this user -->
          <Collection
            ref={query(
              collection(firestore, "positions"),
              where("walletAddress", "==", $walletStore.address),
              orderBy("createdAt", "desc")
            )}
            let:data={positions}
          >
            {@const openPositions =
              positions?.filter((p: Position) => !p.settled) || []}
            {@const settledPositions =
              positions?.filter((p: Position) => p.settled) || []}
            {@const _ = console.log("📊 Loaded positions:", {
              total: positions?.length || 0,
              open: openPositions.length,
              settled: settledPositions.length,
              walletAddress: $walletStore.address,
              positions: positions,
            })}

            <!-- Tabs -->
            <div class="flex space-x-1 bg-surface-100 p-1 rounded-lg mb-6">
              <button
                onclick={() => (activeTab = "open")}
                class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "open"
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Open ({openPositions.length})
              </button>
              <button
                onclick={() => (activeTab = "settled")}
                class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "settled"
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Settled ({settledPositions.length})
              </button>
            </div>

            {#if activeTab === "open"}
              {#if openPositions.length === 0}
                <div class="text-center py-8">
                  <svg
                    class="w-12 h-12 mx-auto text-surface-300 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p class="text-surface-500">No open positions</p>
                  <a
                    href="/"
                    class="text-brand-600 hover:text-brand-700 font-medium text-sm mt-2 inline-block"
                  >
                    Browse markets →
                  </a>
                </div>
              {:else}
                <div class="space-y-3">
                  {#each openPositions as position (position.id)}
                    <div class="bg-surface-50 rounded-xl p-4">
                      <div
                        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div class="flex-1">
                          <a
                            href="/markets/{position.marketId}"
                            class="text-surface-900 font-medium hover:text-brand-600"
                          >
                            {position.marketTitle}
                          </a>
                          <div class="flex items-center space-x-2 mt-1">
                            <span class="text-sm text-surface-600"
                              >{position.optionLabel}</span
                            >
                            <span
                              class={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                position.side === "yes"
                                  ? "bg-yes-light text-yes-dark"
                                  : "bg-no-light text-no-dark"
                              }`}
                            >
                              {position.side.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-lg font-semibold text-surface-900">
                            {formatCredits(position.stake)} AVAX
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
            {:else if settledPositions.length === 0}
              <div class="text-center py-8">
                <svg
                  class="w-12 h-12 mx-auto text-surface-300 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p class="text-surface-500">No settled positions yet</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each settledPositions as position (position.id)}
                  <div class="bg-surface-50 rounded-xl p-4">
                    <div
                      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div class="flex-1">
                        <p class="text-surface-900 font-medium">
                          {position.marketTitle}
                        </p>
                        <div class="flex items-center space-x-2 mt-1">
                          <span class="text-sm text-surface-600"
                            >{position.optionLabel}</span
                          >
                          <span
                            class={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              position.side === "yes"
                                ? "bg-yes-light text-yes-dark"
                                : "bg-no-light text-no-dark"
                            }`}
                          >
                            {position.side.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div class="text-right">
                        <p
                          class={`text-lg font-semibold ${
                            (position.payout ?? 0) > 0
                              ? "text-yes"
                              : "text-surface-400"
                          }`}
                        >
                          {(position.payout ?? 0) > 0
                            ? `+${formatCredits(position.payout! - position.stake)} AVAX`
                            : `-${formatCredits(position.stake)} AVAX`}
                        </p>
                        <p class="text-xs text-surface-400">
                          {(position.payout ?? 0) > 0 ? "Won" : "Lost"}
                        </p>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </Collection>
        {/if}
      </section>
    {/if}
  {:else}
    <!-- SSR fallback -->
    <div class="card animate-pulse">
      <div class="h-16 bg-surface-200 rounded w-16 mb-4"></div>
      <div class="h-6 bg-surface-200 rounded w-1/3 mb-2"></div>
      <div class="h-4 bg-surface-200 rounded w-1/4"></div>
    </div>
  {/if}
</div>
