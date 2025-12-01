<!--
  Admin Page using SvelteFire
  
  Admin dashboard for managing markets.
-->
<script lang="ts">
  import { SignedIn, SignedOut, Collection } from "sveltefire";
  import { collection, query, orderBy } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { createMarket, settleMarket, closeMarket } from "$lib/services";
  import { browser } from "$app/environment";
  import type { CreateMarketInput } from "$lib/types";

  const firestore = browser ? getFirebaseFirestore() : null;

  let error = $state("");

  // Create market form state
  let showCreateForm = $state(false);
  let createLoading = $state(false);
  let formTitle = $state("");
  let formDescription = $state("");
  let formCloseDate = $state("");
  let formOptions = $state([
    { label: "", probability: 0.5 },
    { label: "", probability: 0.5 },
  ]);

  // Settle market state
  let settlingMarketId = $state<string | null>(null);
  let selectedWinningOption = $state<string | null>(null);
  let settleLoading = $state(false);

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
      formOptions = [...formOptions, { label: "", probability: 0.25 }];
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
        options: formOptions.filter((o) => o.label.trim()),
      };

      await createMarket(input);

      // Reset form
      showCreateForm = false;
      formTitle = "";
      formDescription = "";
      formCloseDate = "";
      formOptions = [
        { label: "", probability: 0.5 },
        { label: "", probability: 0.5 },
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
    <SignedOut>
      <div class="card text-center py-12">
        <h2 class="text-lg font-medium text-surface-900 mb-4">
          Please sign in to access admin
        </h2>
        <a href="/login" class="btn-primary">Log In</a>
      </div>
    </SignedOut>

    <SignedIn>
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
                    <input
                      type="number"
                      bind:value={option.probability}
                      min="0.01"
                      max="0.99"
                      step="0.01"
                      aria-label="Option {index + 1} probability"
                      class="input w-24"
                    />
                    <span class="text-sm text-surface-500 w-10">
                      {Math.round(option.probability * 100)}%
                    </span>
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
                                {option.label}: {formatProbability(
                                  option.probability
                                )}
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
    </SignedIn>
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
                    >{formatProbability(option.probability)}</span
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
