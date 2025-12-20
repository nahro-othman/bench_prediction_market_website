<!--
  Admin Page using SvelteFire
  
  Admin dashboard for managing markets.
-->
<script lang="ts">
  import { Collection } from "sveltefire";
  import {
    collection,
    query,
    orderBy,
    where,
    getDocs,
  } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { createMarket, settleMarket, closeMarket } from "$lib/services";
  import { browser } from "$app/environment";
  import { walletStore } from "$lib/services/web3/auth";
  import type { CreateMarketInput } from "$lib/types";
  import { onMount } from "svelte";

  const firestore = browser ? getFirebaseFirestore() : null;

  let error = $state("");

  // Create market form state
  let showCreateForm = $state(false);
  let createLoading = $state(false);
  let formTitle = $state("");
  let formDescription = $state("");
  let formRules = $state("");
  let formCloseDate = $state("");
  let formOptions = $state([
    { label: "", liquidity: 0 },
    { label: "", liquidity: 0 },
  ]);

  // Settle market state
  let settlingMarketId = $state<string | null>(null);
  let selectedWinningOption = $state<string | null>(null);
  let settleLoading = $state(false);

  // Evidence photos state
  let evidencePhotos = $state<any[]>([]);
  let isLoadingEvidence = $state(false);
  let selectedMarketFilter = $state<string>("all");

  onMount(() => {
    if (browser) {
      loadEvidencePhotos();
    }
  });

  async function loadEvidencePhotos() {
    if (!browser) return;

    isLoadingEvidence = true;
    try {
      const db = getFirebaseFirestore();
      const positionsRef = collection(db, "positions");
      const q = query(positionsRef, where("evidenceImages", "!=", null));

      const snapshot = await getDocs(q);
      const photos: any[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.evidenceImages && data.evidenceImages.length > 0) {
          data.evidenceImages.forEach((imageUrl: string) => {
            photos.push({
              id: doc.id,
              imageUrl,
              marketId: data.marketId,
              marketTitle: data.marketTitle || "Unknown Market",
              walletAddress: data.walletAddress,
              optionLabel: data.optionLabel || "Unknown Option",
              side: data.side,
              stake: data.stake,
              createdAt: data.createdAt,
              uploadedAt: data.lastUpdated || data.createdAt,
            });
          });
        }
      });

      // Sort by upload time (newest first)
      photos.sort((a, b) => {
        const aTime = a.uploadedAt?.toDate?.() || new Date(0);
        const bTime = b.uploadedAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      evidencePhotos = photos;
    } catch (error) {
      console.error("Error loading evidence photos:", error);
    } finally {
      isLoadingEvidence = false;
    }
  }

  function truncateAddress(address: string): string {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatEvidenceDate(timestamp: any): string {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  let filteredPhotos = $derived(
    selectedMarketFilter === "all"
      ? evidencePhotos
      : evidencePhotos.filter((p) => p.marketId === selectedMarketFilter)
  );

  let uniqueMarkets = $derived(
    Array.from(new Set(evidencePhotos.map((p) => p.marketId))).map(
      (marketId) => ({
        id: marketId,
        title:
          evidencePhotos.find((p) => p.marketId === marketId)?.marketTitle ||
          "Unknown",
      })
    )
  );

  function formatDate(timestamp: any): string {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatProbability(probability: number): string {
    return `${Math.round(probability * 100)}%`;
  }

  function addOption() {
    if (formOptions.length < 6) {
      formOptions = [...formOptions, { label: "", liquidity: 0 }];
    }
  }

  function removeOption(index: number) {
    if (formOptions.length > 2) {
      formOptions = formOptions.filter((_, i) => i !== index);
    }
  }

  async function handleCreateMarket(e: Event) {
    e.preventDefault();
    createLoading = true;
    error = "";

    try {
      const input: CreateMarketInput = {
        title: formTitle,
        description: formDescription || undefined,
        closeAt: new Date(formCloseDate),
        options: formOptions
          .filter((o) => o.label.trim())
          .map((o) => ({
            label: o.label,
            liquidity: o.liquidity || 0,
          })),
      };

      await createMarket(input);

      // Reset form
      showCreateForm = false;
      formTitle = "";
      formDescription = "";
      formRules = "";
      formCloseDate = "";
      formOptions = [
        { label: "", liquidity: 0 },
        { label: "", liquidity: 0 },
      ];
    } catch (err) {
      console.error("Error creating market:", err);
      error = "Failed to create market. Check your permissions.";
    } finally {
      createLoading = false;
    }
  }

  async function handleCloseMarket(marketId: string) {
    try {
      await closeMarket(marketId);
    } catch (err) {
      console.error("Error closing market:", err);
      error = "Failed to close market.";
    }
  }

  async function handleSettleMarket() {
    if (!settlingMarketId || !selectedWinningOption) return;

    settleLoading = true;
    error = "";

    try {
      const result = await settleMarket(
        settlingMarketId,
        selectedWinningOption
      );

      if (result.success) {
        settlingMarketId = null;
        selectedWinningOption = null;
      } else {
        error = result.error || "Failed to settle market.";
      }
    } catch (err) {
      console.error("Error settling market:", err);
      error = "Failed to settle market.";
    } finally {
      settleLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin - Bench</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if browser}
    {#if !$walletStore.isConnected}
      <!-- Wallet not connected -->
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
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h2 class="text-lg font-medium text-surface-900 mb-2">
          Wallet Required
        </h2>
        <p class="text-surface-500 mb-4">
          Please connect your wallet to access the admin dashboard
        </p>
        <a href="/login" class="btn-primary">Connect Wallet</a>
      </div>
    {:else}
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
          <p class="text-surface-500 mt-1">Manage prediction markets</p>
        </div>
        <button
          onclick={() => (showCreateForm = !showCreateForm)}
          class="btn-primary"
        >
          {showCreateForm ? "Cancel" : "+ Create Market"}
        </button>
      </div>

      {#if error}
        <div class="bg-no-light text-no-dark p-4 rounded-lg mb-6">
          {error}
        </div>
      {/if}

      <!-- Create market form -->
      {#if showCreateForm}
        <section class="card mb-8">
          <h2 class="text-lg font-semibold text-surface-900 mb-4">
            Create New Market
          </h2>

          <form onsubmit={handleCreateMarket} class="space-y-4">
            <div>
              <label for="title" class="label">Title *</label>
              <input
                type="text"
                id="title"
                bind:value={formTitle}
                placeholder="Who will win World Cup 2026?"
                required
                class="input"
              />
            </div>

            <div>
              <label for="description" class="label">Description</label>
              <textarea
                id="description"
                bind:value={formDescription}
                placeholder="Optional description..."
                rows="2"
                class="input"
              ></textarea>
            </div>

            <div>
              <label for="rules" class="label">Rules</label>
              <textarea
                id="rules"
                bind:value={formRules}
                placeholder="Optional rules..."
                rows="2"
                class="input"
              ></textarea>
            </div>

            <div>
              <label for="closeDate" class="label">Close Date *</label>
              <input
                type="datetime-local"
                id="closeDate"
                bind:value={formCloseDate}
                required
                class="input"
              />
            </div>

            <fieldset>
              <div class="flex items-center justify-between mb-2">
                <legend class="label mb-0">Options *</legend>
                <button
                  type="button"
                  onclick={addOption}
                  class="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  disabled={formOptions.length >= 6}
                >
                  + Add Option
                </button>
              </div>
              <div class="space-y-2">
                {#each formOptions as option, index}
                  <div class="flex items-center space-x-2">
                    <input
                      type="text"
                      bind:value={option.label}
                      placeholder="Option label (e.g., Spain)"
                      aria-label="Option {index + 1} label"
                      class="input flex-1"
                    />
                    <div class="flex items-center space-x-2">
                      <input
                        type="number"
                        bind:value={option.liquidity}
                        min="0"
                        step="0.01"
                        placeholder="0"
                        aria-label="Option {index + 1} liquidity"
                        class="input w-32"
                      />
                      <span class="text-sm text-surface-500">AVAX</span>
                    </div>
                    {#if formOptions.length > 2}
                      <button
                        type="button"
                        onclick={() => removeOption(index)}
                        class="text-surface-400 hover:text-no"
                        aria-label="Remove option {index + 1}"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            </fieldset>

            <div class="pt-4">
              <button
                type="submit"
                disabled={createLoading}
                class="btn-primary"
              >
                {createLoading ? "Creating..." : "Create Market"}
              </button>
            </div>
          </form>
        </section>
      {/if}

      <!-- Evidence Photos Section -->
      <section class="mb-8">
        <div
          class="bg-white rounded-xl shadow-sm border border-surface-100 p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2
                class="text-xl font-bold text-surface-900 flex items-center gap-2"
              >
                <svg
                  class="w-6 h-6 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Evidence Photos
              </h2>
              <p class="text-sm text-surface-500 mt-1">
                {evidencePhotos.length}
                {evidencePhotos.length === 1 ? "photo" : "photos"} uploaded by users
              </p>
            </div>
            <button
              onclick={() => loadEvidencePhotos()}
              class="px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-2"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          <!-- Market Filter -->
          {#if uniqueMarkets.length > 1}
            <div class="mb-6">
              <label class="block text-sm font-medium text-surface-700 mb-2"
                >Filter by Market:</label
              >
              <select
                bind:value={selectedMarketFilter}
                class="w-full sm:w-auto px-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all"
                  >All Markets ({evidencePhotos.length})</option
                >
                {#each uniqueMarkets as market}
                  {@const count = evidencePhotos.filter(
                    (p) => p.marketId === market.id
                  ).length}
                  <option value={market.id}>{market.title} ({count})</option>
                {/each}
              </select>
            </div>
          {/if}

          {#if isLoadingEvidence}
            <div class="text-center py-12">
              <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"
              ></div>
              <p class="text-sm text-surface-500 mt-2">Loading evidence...</p>
            </div>
          {:else if filteredPhotos.length === 0}
            <div class="text-center py-12 text-surface-400">
              <svg
                class="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p class="text-lg font-medium text-surface-600">
                No evidence photos yet
              </p>
              <p class="text-sm text-surface-500 mt-1">
                Users can upload evidence after placing bets
              </p>
            </div>
          {:else}
            <!-- Photos Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each filteredPhotos as photo}
                <div
                  class="bg-surface-50 rounded-lg overflow-hidden border border-surface-200 hover:shadow-md transition-shadow"
                >
                  <!-- Image -->
                  <div class="aspect-video bg-surface-200 relative group">
                    <img
                      src={photo.imageUrl}
                      alt="Evidence"
                      class="w-full h-full object-cover"
                    />
                    <a
                      href={photo.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg
                        class="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </a>
                  </div>

                  <!-- Details -->
                  <div class="p-4">
                    <h3 class="font-semibold text-surface-900 mb-2 truncate">
                      <a
                        href="/markets/{photo.marketId}"
                        class="hover:text-brand-600"
                      >
                        {photo.marketTitle}
                      </a>
                    </h3>

                    <div class="space-y-2 text-sm">
                      <div class="flex items-center gap-2">
                        <svg
                          class="w-4 h-4 text-surface-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span
                          class="text-surface-600 font-mono text-xs truncate"
                          >{truncateAddress(photo.walletAddress)}</span
                        >
                      </div>

                      <div class="flex items-center gap-2">
                        <svg
                          class="w-4 h-4 text-surface-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        <span class="text-surface-600 truncate"
                          >{photo.optionLabel}</span
                        >
                        <span
                          class={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            photo.side === "yes"
                              ? "bg-yes-light text-yes-dark"
                              : "bg-no-light text-no-dark"
                          }`}
                        >
                          {photo.side?.toUpperCase()}
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        <svg
                          class="w-4 h-4 text-surface-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span class="text-surface-600">{photo.stake} AVAX</span>
                      </div>

                      <div
                        class="flex items-center gap-2 text-xs text-surface-500"
                      >
                        <svg
                          class="w-4 h-4 flex-shrink-0"
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
                        <span class="truncate"
                          >{formatEvidenceDate(photo.uploadedAt)}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <!-- Markets list -->
      <section>
        <h2 class="text-lg font-semibold text-surface-900 mb-4">All Markets</h2>

        {#if browser && firestore}
          <Collection
            ref={query(
              collection(firestore, "markets"),
              orderBy("createdAt", "desc")
            )}
            let:data={markets}
            let:loading
          >
            {#if loading}
              <div class="space-y-4">
                {#each [1, 2, 3] as _}
                  <div class="card animate-pulse">
                    <div class="h-6 bg-surface-200 rounded w-1/2 mb-2"></div>
                    <div class="h-4 bg-surface-200 rounded w-1/4"></div>
                  </div>
                {/each}
              </div>
            {:else if markets.length === 0}
              <div class="card text-center py-8">
                <p class="text-surface-500">No markets created yet.</p>
              </div>
            {:else}
              <div class="space-y-4">
                {#each markets as market (market.id)}
                  <div class="card">
                    <Collection
                      ref={collection(
                        firestore,
                        "markets",
                        market.id,
                        "options"
                      )}
                      let:data={options}
                    >
                      <div
                        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                      >
                        <div class="flex-1">
                          <div class="flex items-center space-x-2">
                            <h3 class="font-semibold text-surface-900">
                              {market.title}
                            </h3>
                            <span
                              class={`px-2 py-0.5 text-xs rounded-full ${
                                market.status === "open"
                                  ? "bg-yes-light text-yes-dark"
                                  : market.status === "settled"
                                    ? "bg-surface-200 text-surface-600"
                                    : "bg-no-light text-no-dark"
                              }`}
                            >
                              {market.status}
                            </span>
                          </div>
                          <div
                            class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-surface-500"
                          >
                            <span>Closes: {formatDate(market.closeAt)}</span>
                            <span>{options?.length || 0} options</span>
                          </div>
                          <div class="flex flex-wrap gap-2 mt-2">
                            {#each options || [] as option}
                              <span
                                class="text-xs bg-surface-100 px-2 py-1 rounded"
                              >
                                {option.label}: {(
                                  option.initialLiquidity ?? 0
                                ).toFixed(2)} AVAX
                              </span>
                            {/each}
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center space-x-2">
                          {#if market.status === "open"}
                            <button
                              onclick={() => handleCloseMarket(market.id)}
                              class="px-3 py-1.5 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200"
                            >
                              Close
                            </button>
                          {/if}
                          {#if market.status === "closed"}
                            <button
                              onclick={() => (settlingMarketId = market.id)}
                              class="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                            >
                              Settle
                            </button>
                          {/if}
                          <a
                            href="/markets/{market.id}"
                            class="px-3 py-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    </Collection>
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
    <div class="card text-center py-12">
      <div class="animate-pulse">
        <div class="h-6 bg-surface-200 rounded w-1/2 mx-auto mb-4"></div>
        <div class="h-4 bg-surface-200 rounded w-1/4 mx-auto"></div>
      </div>
    </div>
  {/if}
</div>

<!-- Settle market modal -->
{#if settlingMarketId && browser && firestore}
  <Collection ref={collection(firestore, "markets")} let:data={allMarkets}>
    {@const marketToSettle = allMarkets?.find((m) => m.id === settlingMarketId)}
    {#if marketToSettle}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onclick={() => (settlingMarketId = null)}
        onkeydown={(e) => e.key === "Escape" && (settlingMarketId = null)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-dialog-title"
        tabindex="-1"
      >
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
        >
          <h2
            id="settle-dialog-title"
            class="text-lg font-semibold text-surface-900 mb-4"
          >
            Settle Market
          </h2>
          <p class="text-surface-600 mb-4">
            Select the winning option for "{marketToSettle.title}"
          </p>

          <Collection
            ref={collection(firestore, "markets", settlingMarketId, "options")}
            let:data={options}
          >
            <div class="space-y-2 mb-6">
              {#each options || [] as option}
                <label
                  class="flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors {selectedWinningOption ===
                  option.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-surface-200 hover:border-surface-300'}"
                >
                  <input
                    type="radio"
                    name="winningOption"
                    value={option.id}
                    bind:group={selectedWinningOption}
                    class="sr-only"
                  />
                  <span class="font-medium text-surface-900"
                    >{option.label}</span
                  >
                  <span class="ml-auto text-surface-500"
                    >{(option.initialLiquidity ?? 0).toFixed(2)} AVAX</span
                  >
                </label>
              {/each}
            </div>
          </Collection>

          <div class="flex space-x-3">
            <button
              onclick={() => (settlingMarketId = null)}
              class="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onclick={handleSettleMarket}
              disabled={!selectedWinningOption || settleLoading}
              class="flex-1 btn-primary disabled:opacity-50"
            >
              {settleLoading ? "Settling..." : "Confirm Settlement"}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </Collection>
{/if}
