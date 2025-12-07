<script lang="ts">
  import { onMount } from "svelte";

  // Props using Svelte 5 runes
  let { marketId, options = [] }: { marketId: string; options: any[] } =
    $props();

  let chartData = $state<
    { volume: number; label: string; percentage: number }[]
  >([]);
  let totalVolume = $state(0);
  let maxVolume = $state(0);

  $effect(() => {
    if (options && options.length > 0) {
      // Calculate total volume across all options
      totalVolume = options.reduce((sum, opt) => {
        return sum + (opt.yesVolume || 0) + (opt.noVolume || 0);
      }, 0);

      // Calculate max volume for scaling
      maxVolume = Math.max(
        ...options.map((opt) => (opt.yesVolume || 0) + (opt.noVolume || 0))
      );

      // Prepare chart data
      chartData = options
        .map((opt) => {
          const volume = (opt.yesVolume || 0) + (opt.noVolume || 0);
          return {
            label: opt.label,
            volume,
            percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0,
          };
        })
        .sort((a, b) => b.volume - a.volume);
    }
  });

  function formatAVAX(amount: number): string {
    return amount.toFixed(4);
  }
</script>

{#if totalVolume > 0}
  <div class="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-surface-900">Betting Activity</h3>
      <div class="text-sm text-surface-500">
        Total Volume: <span class="font-medium text-surface-900"
          >{formatAVAX(totalVolume)} AVAX</span
        >
      </div>
    </div>

    <!-- Bar Chart -->
    <div class="space-y-4">
      {#each chartData as item}
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-surface-700">{item.label}</span>
            <div class="flex items-center gap-4">
              <span class="text-surface-500">{item.percentage.toFixed(1)}%</span
              >
              <span class="text-brand-600 font-medium"
                >{formatAVAX(item.volume)} AVAX</span
              >
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="relative h-8 bg-surface-100 rounded-lg overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-3"
              style={`width: ${item.percentage}%`}
            >
              {#if item.percentage > 15}
                <span class="text-xs font-medium text-white"
                  >{formatAVAX(item.volume)} AVAX</span
                >
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Legend -->
    <div
      class="mt-6 pt-6 border-t border-surface-100 grid grid-cols-2 gap-4 text-sm"
    >
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-yes-dark"></div>
        <span class="text-surface-600"
          >Total bets: <span class="font-medium text-surface-900"
            >{options.reduce(
              (sum, opt) =>
                sum +
                ((opt.yesVolume || 0) > 0 ? 1 : 0) +
                ((opt.noVolume || 0) > 0 ? 1 : 0),
              0
            )}</span
          ></span
        >
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-brand-600"></div>
        <span class="text-surface-600"
          >Active options: <span class="font-medium text-surface-900"
            >{chartData.filter((d) => d.volume > 0).length}</span
          ></span
        >
      </div>
    </div>
  </div>
{:else}
  <div
    class="bg-white rounded-xl shadow-sm border border-surface-100 p-8 text-center"
  >
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
    <h3 class="text-lg font-medium text-surface-900 mb-2">
      No betting activity yet
    </h3>
    <p class="text-surface-500">Be the first to place a bet on this market!</p>
  </div>
{/if}

<style>
  @keyframes grow {
    from {
      width: 0%;
    }
  }

  .animate-grow {
    animation: grow 0.8s ease-out;
  }
</style>
