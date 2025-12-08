<script lang="ts">
  import { browser } from "$app/environment";
  import { walletStore } from "$lib/services/web3/auth";
  import { placeBet } from "$lib/services/bets";
  import { getFirebaseFirestore } from "$lib/firebase";
  import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
  } from "firebase/firestore";

  let testResults: {
    name: string;
    status: "pass" | "fail" | "running";
    message: string;
  }[] = $state([]);
  let overallStatus = $state<"idle" | "running" | "complete">("idle");
  let totalTests = 0;
  let passedTests = 0;

  function addResult(name: string, status: "pass" | "fail", message: string) {
    testResults = [...testResults, { name, status, message }];
    if (status === "pass") passedTests++;
    totalTests++;
  }

  async function runAllTests() {
    testResults = [];
    totalTests = 0;
    passedTests = 0;
    overallStatus = "running";

    // Test 1: Browser Environment
    try {
      if (browser) {
        addResult("Browser Environment", "pass", "Running in browser");
      } else {
        addResult("Browser Environment", "fail", "Not in browser");
      }
    } catch (error) {
      addResult("Browser Environment", "fail", error.message);
    }

    // Test 2: Wallet Connection
    try {
      if ($walletStore.isConnected && $walletStore.address) {
        addResult(
          "Wallet Connection",
          "pass",
          `Connected: ${$walletStore.address.substring(0, 10)}...`
        );
      } else {
        addResult("Wallet Connection", "fail", "Wallet not connected");
        overallStatus = "complete";
        return;
      }
    } catch (error) {
      addResult("Wallet Connection", "fail", error.message);
      overallStatus = "complete";
      return;
    }

    // Test 3: Correct Network
    try {
      if ($walletStore.isCorrectNetwork) {
        addResult(
          "Network Check",
          "pass",
          "On Avalanche Fuji (Chain ID: 43113)"
        );
      } else {
        addResult(
          "Network Check",
          "fail",
          "Wrong network - switch to Avalanche Fuji"
        );
      }
    } catch (error) {
      addResult("Network Check", "fail", error.message);
    }

    // Test 4: AVAX Balance
    try {
      const balance = parseFloat($walletStore.balance || "0");
      if (balance > 0) {
        addResult(
          "AVAX Balance",
          "pass",
          `Balance: ${balance.toFixed(2)} AVAX`
        );
      } else {
        addResult("AVAX Balance", "fail", "No AVAX balance - get from faucet");
      }
    } catch (error) {
      addResult("AVAX Balance", "fail", error.message);
    }

    // Test 5: Firebase Connection
    try {
      const db = getFirebaseFirestore();
      if (db) {
        addResult("Firebase Init", "pass", "Firebase initialized");
      } else {
        addResult("Firebase Init", "fail", "Firebase not initialized");
        overallStatus = "complete";
        return;
      }
    } catch (error) {
      addResult("Firebase Init", "fail", error.message);
      overallStatus = "complete";
      return;
    }

    // Test 6: Firestore Data Access
    try {
      const db = getFirebaseFirestore();
      const marketsSnap = await getDocs(collection(db, "markets"));
      addResult(
        "Firestore Access",
        "pass",
        `Found ${marketsSnap.size} markets`
      );

      if (marketsSnap.size === 0) {
        // Create test market
        try {
          const marketRef = await addDoc(collection(db, "markets"), {
            title: "Integration Test Market",
            description: "Auto-created for testing",
            status: "open",
            sport: "test",
            closeAt: new Date(Date.now() + 86400000),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          await addDoc(collection(db, "markets", marketRef.id, "options"), {
            label: "Test Option A",
            probability: 0.5,
            yesVolume: 0,
            noVolume: 0,
            order: 0,
          });

          addResult(
            "Market Creation",
            "pass",
            `Created test market: ${marketRef.id}`
          );
        } catch (error) {
          addResult("Market Creation", "fail", error.message);
        }
      }
    } catch (error) {
      addResult("Firestore Access", "fail", error.message);
    }

    // Test 7: Bet Placement
    try {
      const db = getFirebaseFirestore();
      const marketsSnap = await getDocs(collection(db, "markets"));

      if (marketsSnap.size > 0) {
        const market = marketsSnap.docs[0];
        const marketId = market.id;

        const optionsSnap = await getDocs(
          collection(db, "markets", marketId, "options")
        );

        if (optionsSnap.size > 0) {
          const option = optionsSnap.docs[0];
          const optionId = option.id;

          const result = await placeBet(marketId, optionId, "yes", 0.001);

          if (result.success) {
            addResult(
              "Bet Placement",
              "pass",
              `Bet placed: ${result.positionId}`
            );
          } else {
            addResult("Bet Placement", "fail", result.error || "Unknown error");
          }
        } else {
          addResult("Bet Placement", "fail", "No options found in market");
        }
      } else {
        addResult("Bet Placement", "fail", "No markets found to test betting");
      }
    } catch (error) {
      addResult("Bet Placement", "fail", error.message);
    }

    // Test 8: AI Service
    try {
      const { analyzeMarket } = await import("$lib/services/ai");
      const insight = await analyzeMarket("test-market", "Test Market", [
        { label: "Option A", probability: 0.65 },
        { label: "Option B", probability: 0.35 },
      ]);

      if (insight && insight.confidence >= 0 && insight.confidence <= 1) {
        addResult(
          "AI Service",
          "pass",
          `AI confidence: ${(insight.confidence * 100).toFixed(0)}%`
        );
      } else {
        addResult("AI Service", "fail", "Invalid AI response");
      }
    } catch (error) {
      addResult("AI Service", "fail", error.message);
    }

    // Test 9: AMM Utilities
    try {
      const { initializePool, calculateProbability } = await import(
        "$lib/utils/amm"
      );
      const pool = initializePool(1000);
      const prob = calculateProbability(pool);

      if (prob === 0.5) {
        addResult(
          "AMM Utilities",
          "pass",
          "Pool initialized, probability: 50%"
        );
      } else {
        addResult("AMM Utilities", "fail", "Unexpected probability");
      }
    } catch (error) {
      addResult("AMM Utilities", "fail", error.message);
    }

    // Test 10: Component Imports
    try {
      await import("$lib/components/markets/AIInsights.svelte");
      await import("$lib/components/markets/GasComparison.svelte");
      await import("$lib/components/markets/PaymentStatus.svelte");
      addResult("Components", "pass", "All new components import successfully");
    } catch (error) {
      addResult("Components", "fail", error.message);
    }

    overallStatus = "complete";
  }
</script>

<svelte:head>
  <title>Integration Tests - Bench</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold mb-2">🧪 Integration Test Suite</h1>
    <p class="text-gray-600 mb-6">
      Comprehensive tests for on-chain and off-chain functionality
    </p>

    <!-- Wallet Status -->
    <div
      class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200"
    >
      <h2 class="font-semibold mb-2">Wallet Status</h2>
      {#if browser && $walletStore.isConnected}
        <div class="space-y-1 text-sm">
          <p>
            ✅ Connected: <code class="bg-blue-100 px-2 py-1 rounded"
              >{$walletStore.address}</code
            >
          </p>
          <p>💰 Balance: <strong>{$walletStore.balance} AVAX</strong></p>
          <p>
            🌐 Network: {$walletStore.isCorrectNetwork
              ? "✅ Avalanche Fuji"
              : "❌ Wrong network"}
          </p>
        </div>
      {:else}
        <p class="text-sm text-red-600">
          ❌ Wallet not connected. <a
            href="/login"
            class="underline font-medium">Connect wallet</a
          > to run tests.
        </p>
      {/if}
    </div>

    <!-- Run Tests Button -->
    <button
      onclick={runAllTests}
      disabled={!browser ||
        !$walletStore.isConnected ||
        overallStatus === "running"}
      class="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
    >
      {#if overallStatus === "running"}
        ⏳ Running Tests...
      {:else if overallStatus === "complete"}
        🔄 Run Tests Again
      {:else}
        🚀 Run All Integration Tests
      {/if}
    </button>

    <!-- Results Summary -->
    {#if overallStatus === "complete"}
      <div
        class={`rounded-lg p-4 mb-6 ${passedTests === totalTests ? "bg-green-50 border border-green-500" : "bg-yellow-50 border border-yellow-500"}`}
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-lg">
              {passedTests === totalTests
                ? "✅ All Tests Passed!"
                : "⚠️ Some Tests Failed"}
            </h3>
            <p class="text-sm">
              {passedTests} / {totalTests} tests passed ({(
                (passedTests / totalTests) *
                100
              ).toFixed(0)}%)
            </p>
          </div>
          <div class="text-4xl">
            {passedTests === totalTests ? "🎉" : "🔧"}
          </div>
        </div>
      </div>
    {/if}

    <!-- Test Results -->
    {#if testResults.length > 0}
      <div class="space-y-2">
        <h2 class="font-semibold text-lg mb-3">Test Results:</h2>
        {#each testResults as result, index}
          <div
            class={`p-3 rounded-lg border-2 ${
              result.status === "pass"
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div class="flex items-start gap-3">
              <span class="text-xl">
                {result.status === "pass" ? "✅" : "❌"}
              </span>
              <div class="flex-1">
                <h3 class="font-semibold">
                  {index + 1}. {result.name}
                </h3>
                <p class="text-sm text-gray-700">{result.message}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Help Section -->
    <div class="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 class="font-semibold mb-2">💡 What This Tests</h3>
      <ul class="text-sm space-y-1 ml-4 list-disc">
        <li>Browser environment and client-side execution</li>
        <li>MetaMask wallet connection and authentication</li>
        <li>Avalanche Fuji network configuration</li>
        <li>AVAX balance and gas availability</li>
        <li>Firebase initialization and connectivity</li>
        <li>Firestore data access (read/write)</li>
        <li>Bet placement (full flow including x402 simulation)</li>
        <li>AI service functionality (market analysis)</li>
        <li>AMM utilities (pricing calculations)</li>
        <li>Component imports (all new features)</li>
      </ul>

      <h3 class="font-semibold mt-4 mb-2">🔧 If Tests Fail</h3>
      <ul class="text-sm space-y-1 ml-4 list-disc">
        <li>
          Check <a href="/test-bet" class="text-blue-600 underline"
            >detailed diagnostic page</a
          >
        </li>
        <li>
          See <a href="/TROUBLESHOOTING.md" class="text-blue-600 underline"
            >TROUBLESHOOTING.md</a
          >
        </li>
        <li>
          Review <a
            href="/PRODUCTION_READINESS_CHECK.md"
            class="text-blue-600 underline">Production Checklist</a
          >
        </li>
      </ul>
    </div>

    <!-- Navigation -->
    <div class="mt-6 flex gap-3">
      <a href="/" class="btn-secondary flex-1 text-center">← Home</a>
      <a href="/test-bet" class="btn-secondary flex-1 text-center"
        >Detailed Tests</a
      >
      <a href="/admin" class="btn-primary flex-1 text-center"
        >Admin Dashboard →</a
      >
    </div>
  </div>
</div>
