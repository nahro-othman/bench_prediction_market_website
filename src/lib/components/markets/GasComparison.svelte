<script lang="ts">
  /**
   * Gas Comparison Component
   * Showcases x402 payment savings vs traditional ERC20
   */

  export let amount: number = 100;

  // Gas estimates (in gas units)
  const TRADITIONAL_APPROVE_GAS = 46000;
  const TRADITIONAL_TRANSFER_GAS = 65000;
  const X402_PAYMENT_GAS = 60000;

  // Avalanche gas price (in gwei)
  const AVG_GAS_PRICE = 25; // 25 gwei average on Avalanche
  const GWEI_TO_AVAX = 0.000000001;
  const AVAX_PRICE_USD = 35; // Approximate AVAX price

  // Calculate costs
  function calculateTraditionalCost() {
    const totalGas = TRADITIONAL_APPROVE_GAS + TRADITIONAL_TRANSFER_GAS;
    const avaxCost = totalGas * AVG_GAS_PRICE * GWEI_TO_AVAX;
    const usdCost = avaxCost * AVAX_PRICE_USD;
    return {
      gas: totalGas,
      avax: avaxCost,
      usd: usdCost,
      transactions: 2,
    };
  }

  function calculateX402Cost() {
    const avaxCost = X402_PAYMENT_GAS * AVG_GAS_PRICE * GWEI_TO_AVAX;
    const usdCost = avaxCost * AVAX_PRICE_USD;
    return {
      gas: X402_PAYMENT_GAS,
      avax: avaxCost,
      usd: usdCost,
      transactions: 1,
    };
  }

  $: traditional = calculateTraditionalCost();
  $: x402 = calculateX402Cost();
  $: savings = {
    gas: traditional.gas - x402.gas,
    gasPercent: (
      ((traditional.gas - x402.gas) / traditional.gas) *
      100
    ).toFixed(1),
    avax: traditional.avax - x402.avax,
    usd: traditional.usd - x402.usd,
    usdPercent: (
      ((traditional.usd - x402.usd) / traditional.usd) *
      100
    ).toFixed(1),
    clicks: traditional.transactions - x402.transactions,
  };
</script>

<div class="bg-white rounded-lg border-2 border-blue-500 p-6 shadow-lg">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <div
      class="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center"
    >
      <svg
        class="w-7 h-7 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    </div>
    <div>
      <h3 class="text-xl font-bold text-gray-900">⚡ x402 Gas Savings</h3>
      <p class="text-sm text-gray-600">Real cost comparison for your bet</p>
    </div>
  </div>

  <!-- Comparison Cards -->
  <div class="grid md:grid-cols-2 gap-4 mb-6">
    <!-- Traditional ERC20 -->
    <div class="bg-red-50 rounded-lg p-4 border border-red-200">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-gray-900">Traditional ERC20</h4>
        <span
          class="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-semibold"
          >OLD</span
        >
      </div>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Step 1: Approve</span>
          <span class="font-mono text-gray-900"
            >{TRADITIONAL_APPROVE_GAS.toLocaleString()} gas</span
          >
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Step 2: Transfer</span>
          <span class="font-mono text-gray-900"
            >{TRADITIONAL_TRANSFER_GAS.toLocaleString()} gas</span
          >
        </div>
        <div class="border-t border-red-200 pt-2 mt-2">
          <div class="flex justify-between font-bold">
            <span>Total Gas</span>
            <span class="font-mono">{traditional.gas.toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-red-600 mt-1">
            <span>Cost (USD)</span>
            <span class="font-mono">${traditional.usd.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- x402 Payment -->
    <div
      class="bg-green-50 rounded-lg p-4 border-2 border-green-500 relative overflow-hidden"
    >
      <div
        class="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold transform rotate-12 translate-x-4 -translate-y-1"
      >
        ✨ NEW
      </div>

      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-gray-900">x402 Payment</h4>
        <span
          class="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-semibold"
          >BEST</span
        >
      </div>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Single Transaction</span>
          <span class="font-mono text-gray-900"
            >{X402_PAYMENT_GAS.toLocaleString()} gas</span
          >
        </div>
        <div class="flex justify-between text-green-600 font-medium">
          <span>✓ No approve needed</span>
          <span>✓ Instant</span>
        </div>
        <div class="border-t border-green-200 pt-2 mt-2">
          <div class="flex justify-between font-bold">
            <span>Total Gas</span>
            <span class="font-mono">{x402.gas.toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-green-600 mt-1">
            <span>Cost (USD)</span>
            <span class="font-mono">${x402.usd.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Savings Highlight -->
  <div
    class="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white"
  >
    <div class="text-center mb-4">
      <p class="text-sm font-medium opacity-90 mb-1">YOU SAVE</p>
      <p class="text-4xl font-bold">{savings.gasPercent}%</p>
      <p class="text-sm opacity-90">on gas fees with x402</p>
    </div>

    <div class="grid grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-2xl font-bold">${savings.usd.toFixed(4)}</p>
        <p class="text-xs opacity-90">USD Saved</p>
      </div>
      <div>
        <p class="text-2xl font-bold">{savings.gas.toLocaleString()}</p>
        <p class="text-xs opacity-90">Gas Units Saved</p>
      </div>
      <div>
        <p class="text-2xl font-bold">{savings.clicks}</p>
        <p class="text-xs opacity-90">Fewer Clicks</p>
      </div>
    </div>
  </div>

  <!-- Details -->
  <div class="mt-6 pt-6 border-t border-gray-200">
    <details class="group">
      <summary
        class="cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center justify-between"
      >
        <span>📊 How we calculated this</span>
        <svg
          class="w-4 h-4 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>

      <div
        class="mt-4 text-sm text-gray-600 space-y-2 pl-4 border-l-2 border-blue-200"
      >
        <p><strong>Traditional ERC20 Flow:</strong></p>
        <ul class="list-disc pl-5 space-y-1">
          <li>
            Transaction 1: approve() - Allow contract to spend tokens ({TRADITIONAL_APPROVE_GAS.toLocaleString()}
            gas)
          </li>
          <li>
            Transaction 2: transferFrom() - Execute actual transfer ({TRADITIONAL_TRANSFER_GAS.toLocaleString()}
            gas)
          </li>
          <li>
            Total: {traditional.gas.toLocaleString()} gas, 2 wallet confirmations
          </li>
        </ul>

        <p class="pt-2"><strong>x402 Payment Flow:</strong></p>
        <ul class="list-disc pl-5 space-y-1">
          <li>
            Transaction 1: initiatePayment() - Single atomic transaction ({X402_PAYMENT_GAS.toLocaleString()}
            gas)
          </li>
          <li>No approval needed - payment streams directly</li>
          <li>Total: {x402.gas.toLocaleString()} gas, 1 wallet confirmation</li>
        </ul>

        <p class="pt-2">
          <strong>Gas Price:</strong>
          {AVG_GAS_PRICE} gwei (Avalanche C-Chain average)
        </p>
        <p><strong>AVAX Price:</strong> ${AVAX_PRICE_USD} USD (approximate)</p>
      </div>
    </details>
  </div>

  <!-- Benefits List -->
  <div class="mt-6 grid md:grid-cols-2 gap-3">
    <div class="flex items-start gap-2 text-sm">
      <svg
        class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
        <p class="font-medium text-gray-900">50% Fewer Clicks</p>
        <p class="text-gray-600">Better user experience</p>
      </div>
    </div>

    <div class="flex items-start gap-2 text-sm">
      <svg
        class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
        <p class="font-medium text-gray-900">Instant Settlement</p>
        <p class="text-gray-600">Sub-second on Avalanche</p>
      </div>
    </div>

    <div class="flex items-start gap-2 text-sm">
      <svg
        class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
        <p class="font-medium text-gray-900">Real-time Status</p>
        <p class="text-gray-600">Track payment progress</p>
      </div>
    </div>

    <div class="flex items-start gap-2 text-sm">
      <svg
        class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
        <p class="font-medium text-gray-900">Safer Transactions</p>
        <p class="text-gray-600">Atomic execution</p>
      </div>
    </div>
  </div>
</div>


