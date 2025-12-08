<script lang="ts">
  import { analyzeMarket, type MarketInsight } from "$lib/services/ai";
  import { onMount } from "svelte";

  export let marketId: string;
  export let marketTitle: string;
  export let options: { label: string; probability: number }[] = [];

  let insight: MarketInsight | null = null;
  let loading = true;

  onMount(async () => {
    if (options.length > 0) {
      try {
        insight = await analyzeMarket(marketId, marketTitle, options);
      } catch (error) {
        console.error("Failed to load AI insights:", error);
      } finally {
        loading = false;
      }
    }
  });

  function getRiskColor(risk: "low" | "medium" | "high"): string {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "high":
        return "text-red-600 bg-red-50";
    }
  }

  function getConfidenceWidth(confidence: number): string {
    return `${confidence * 100}%`;
  }
</script>

{#if loading}
  <div
    class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6 animate-pulse"
  >
    <div class="h-6 bg-purple-200 rounded w-1/3 mb-4"></div>
    <div class="space-y-2">
      <div class="h-4 bg-purple-200 rounded"></div>
      <div class="h-4 bg-purple-200 rounded w-5/6"></div>
    </div>
  </div>
{:else if insight}
  <div
    class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border border-purple-200"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">AI Market Analysis</h3>
          <p class="text-sm text-gray-600">Powered by machine learning</p>
        </div>
      </div>

      <div class="text-right">
        <span class="text-xs text-gray-500 uppercase tracking-wider"
          >Risk Level</span
        >
        <div class="mt-1">
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold {getRiskColor(
              insight.riskLevel
            )}"
          >
            {insight.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>
    </div>

    <!-- Confidence Bar -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">AI Confidence</span>
        <span class="text-sm font-bold text-purple-600"
          >{(insight.confidence * 100).toFixed(0)}%</span
        >
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500"
          style="width: {getConfidenceWidth(insight.confidence)}"
        ></div>
      </div>
    </div>

    <!-- Prediction -->
    <div class="bg-white rounded-lg p-4 mb-4 border border-purple-100">
      <div class="flex items-start gap-3">
        <svg
          class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">AI Prediction</p>
          <p class="text-base font-bold text-gray-900">{insight.prediction}</p>
        </div>
      </div>
    </div>

    <!-- Reasoning -->
    <div class="space-y-2 mb-4">
      <p class="text-sm font-medium text-gray-700 mb-2">Analysis:</p>
      {#each insight.reasoning as reason}
        <div class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-sm text-gray-700">{reason}</p>
        </div>
      {/each}
    </div>

    <!-- Suggested Stake -->
    {#if insight.suggestedStake}
      <div class="bg-purple-100 rounded-lg p-3 border border-purple-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            <span class="text-sm font-medium text-purple-900"
              >AI Suggested Stake</span
            >
          </div>
          <span class="text-lg font-bold text-purple-600"
            >{insight.suggestedStake} AVAX</span
          >
        </div>
      </div>
    {/if}

    <!-- Disclaimer -->
    <div class="mt-4 pt-4 border-t border-purple-200">
      <p class="text-xs text-gray-500 italic">
        ⚠️ AI predictions are for informational purposes only. Always do your
        own research.
      </p>
    </div>
  </div>
{/if}

<style>
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
