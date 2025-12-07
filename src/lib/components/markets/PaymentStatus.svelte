<script lang="ts">
  /**
   * Real-time Payment Status Component
   * Visualizes x402 payment streaming
   */

  import { onMount } from "svelte";

  export let paymentId: string | null = null;
  export let status: "initiated" | "streaming" | "completed" | "failed" =
    "initiated";
  export let amount: number = 0;

  let progress = 0;
  let showStatus = false;

  $: if (paymentId && status !== "completed") {
    showStatus = true;
    animateProgress();
  }

  function animateProgress() {
    progress = 0;
    const interval = setInterval(() => {
      if (status === "initiated") {
        progress = Math.min(progress + 10, 30);
      } else if (status === "streaming") {
        progress = Math.min(progress + 15, 90);
      } else if (status === "completed") {
        progress = 100;
        setTimeout(() => {
          showStatus = false;
        }, 2000);
        clearInterval(interval);
      } else if (status === "failed") {
        clearInterval(interval);
      }
    }, 100);
  }

  function getStatusIcon(currentStatus: typeof status) {
    switch (currentStatus) {
      case "initiated":
        return "🔄";
      case "streaming":
        return "⚡";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
    }
  }

  function getStatusColor(currentStatus: typeof status) {
    switch (currentStatus) {
      case "initiated":
        return "bg-blue-500";
      case "streaming":
        return "bg-purple-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
    }
  }

  function getStatusText(currentStatus: typeof status) {
    switch (currentStatus) {
      case "initiated":
        return "Initiating payment...";
      case "streaming":
        return "Streaming payment...";
      case "completed":
        return "Payment completed!";
      case "failed":
        return "Payment failed";
    }
  }
</script>

{#if showStatus}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up"
    >
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-6xl mb-3 animate-bounce">
          {getStatusIcon(status)}
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">
          {getStatusText(status)}
        </h3>
        <p class="text-gray-600">
          Processing {amount} credits via x402
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="mb-6">
        <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            class="h-full {getStatusColor(
              status
            )} transition-all duration-300 ease-out rounded-full relative overflow-hidden"
            style="width: {progress}%"
          >
            <!-- Animated shimmer effect -->
            <div class="absolute inset-0 shimmer"></div>
          </div>
        </div>
        <div class="flex justify-between mt-2 text-sm text-gray-600">
          <span>{progress}%</span>
          <span class="font-mono">{paymentId?.substring(0, 8)}...</span>
        </div>
      </div>

      <!-- Status Steps -->
      <div class="space-y-3 mb-6">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full {status !== 'initiated'
              ? 'bg-green-500'
              : 'bg-blue-500'} flex items-center justify-center text-white font-bold text-sm"
          >
            {status !== "initiated" ? "✓" : "1"}
          </div>
          <div>
            <p class="font-medium text-gray-900">Payment Initiated</p>
            <p class="text-xs text-gray-500">x402 payment created</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full {status === 'completed'
              ? 'bg-green-500'
              : status === 'streaming'
                ? 'bg-purple-500 animate-pulse'
                : 'bg-gray-300'} flex items-center justify-center text-white font-bold text-sm"
          >
            {status === "completed" ? "✓" : status === "streaming" ? "2" : "2"}
          </div>
          <div>
            <p class="font-medium text-gray-900">Streaming to Contract</p>
            <p class="text-xs text-gray-500">Real-time payment flow</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full {status === 'completed'
              ? 'bg-green-500'
              : 'bg-gray-300'} flex items-center justify-center text-white font-bold text-sm"
          >
            {status === "completed" ? "✓" : "3"}
          </div>
          <div>
            <p class="font-medium text-gray-900">Finalized</p>
            <p class="text-xs text-gray-500">Position created</p>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div class="text-sm text-blue-900">
            <p class="font-medium mb-1">Why is this faster?</p>
            <p class="text-blue-700">
              x402 eliminates the approval step, completing your bet in a single
              transaction with 30% gas savings!
            </p>
          </div>
        </div>
      </div>

      <!-- Close button (only show when completed or failed) -->
      {#if status === "completed" || status === "failed"}
        <button
          on:click={() => (showStatus = false)}
          class="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
        >
          {status === "completed" ? "Continue Trading" : "Try Again"}
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .shimmer::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }
</style>


