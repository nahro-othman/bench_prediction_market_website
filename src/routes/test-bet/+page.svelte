<script lang="ts">
  import { browser } from "$app/environment";
  import { getFirebaseFirestore } from "$lib/firebase";
  import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { walletStore } from "$lib/services/web3/auth";
  import { placeBet } from "$lib/services/bets";

  let logs: string[] = $state([]);
  let testStatus = $state("");
  let marketId = $state("");
  let optionId = $state("");

  function log(message: string) {
    console.log(message);
    logs = [...logs, `${new Date().toLocaleTimeString()}: ${message}`];
  }

  async function runTests() {
    logs = [];
    testStatus = "running";

    try {
      // Test 1: Check if browser
      log("✅ Test 1: Browser environment detected");

      // Test 2: Check wallet
      if ($walletStore.isConnected) {
        log(`✅ Test 2: Wallet connected - ${$walletStore.address}`);
        log(`   Balance: ${$walletStore.balance} AVAX`);
      } else {
        log("❌ Test 2: Wallet NOT connected");
        testStatus = "failed";
        return;
      }

      // Test 3: Check Firebase
      try {
        const db = getFirebaseFirestore();
        log("✅ Test 3: Firebase initialized");

        // Test 4: List markets
        const marketsSnap = await getDocs(collection(db, "markets"));
        log(`✅ Test 4: Found ${marketsSnap.size} markets in Firestore`);

        if (marketsSnap.size === 0) {
          log("⚠️  No markets found! Creating a test market...");

          // Create test market
          const marketRef = await addDoc(collection(db, "markets"), {
            title: "Test Market - Delete Me",
            description: "This is a test market for debugging",
            status: "open",
            sport: "test",
            closeAt: new Date(Date.now() + 86400000), // Tomorrow
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          log(`✅ Created test market: ${marketRef.id}`);
          marketId = marketRef.id;

          // Create test option
          const optionRef = await addDoc(
            collection(db, "markets", marketRef.id, "options"),
            {
              label: "Test Option A",
              probability: 0.5,
              yesVolume: 0,
              noVolume: 0,
              order: 0,
            }
          );

          log(`✅ Created test option: ${optionRef.id}`);
          optionId = optionRef.id;
        } else {
          // Use first market
          const firstMarket = marketsSnap.docs[0];
          marketId = firstMarket.id;
          log(`   Using market: ${firstMarket.data().title} (${marketId})`);

          // Get first option
          const optionsSnap = await getDocs(
            collection(db, "markets", marketId, "options")
          );
          if (optionsSnap.size > 0) {
            optionId = optionsSnap.docs[0].id;
            log(
              `   Using option: ${optionsSnap.docs[0].data().label} (${optionId})`
            );
          } else {
            log("❌ No options found for this market!");
            testStatus = "failed";
            return;
          }
        }

        // Test 5: Try to place a bet
        log("🎲 Test 5: Attempting to place a test bet (0.001 AVAX)...");
        const result = await placeBet(marketId, optionId, "yes", 0.001);

        if (result.success) {
          log(`✅ Test 5: Bet placed successfully!`);
          log(`   Position ID: ${result.positionId}`);
          log(`   Message: ${result.message}`);
          testStatus = "success";
        } else {
          log(`❌ Test 5: Bet failed - ${result.error}`);
          testStatus = "failed";
        }
      } catch (firebaseError) {
        log(`❌ Test 3/4/5: Firebase error - ${firebaseError.message}`);
        console.error("Firebase error:", firebaseError);
        testStatus = "failed";
      }
    } catch (error) {
      log(`❌ Unexpected error: ${error.message}`);
      console.error("Error:", error);
      testStatus = "failed";
    }
  }

  function clearLogs() {
    logs = [];
    testStatus = "";
  }
</script>

<svelte:head>
  <title>Bet Placement Test - Bench</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-2xl font-bold mb-4">🧪 Bet Placement Diagnostic Tool</h1>

    <p class="text-gray-600 mb-6">
      This page will test your bet placement system and show you exactly what's
      wrong.
    </p>

    <!-- Wallet Status -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6">
      <h2 class="font-semibold mb-2">Wallet Status</h2>
      {#if browser && $walletStore.isConnected}
        <p class="text-sm">
          ✅ Connected: <code class="bg-gray-200 px-2 py-1 rounded"
            >{$walletStore.address}</code
          ><br />
          💰 Balance: <strong>{$walletStore.balance} AVAX</strong><br />
          🌐 Network: {$walletStore.isCorrectNetwork
            ? "✅ Avalanche Fuji"
            : "❌ Wrong network"}
        </p>
      {:else}
        <p class="text-sm text-red-600">
          ❌ Wallet not connected. <a href="/login" class="underline"
            >Connect wallet</a
          > first.
        </p>
      {/if}
    </div>

    <!-- Test Button -->
    <div class="mb-6">
      <button
        onclick={runTests}
        disabled={!browser ||
          !$walletStore.isConnected ||
          testStatus === "running"}
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {testStatus === "running"
          ? "⏳ Running Tests..."
          : "🧪 Run Diagnostic Tests"}
      </button>

      {#if logs.length > 0}
        <button
          onclick={clearLogs}
          class="ml-3 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Clear Logs
        </button>
      {/if}
    </div>

    <!-- Test Results -->
    {#if testStatus}
      <div
        class={`rounded-lg p-4 mb-6 ${
          testStatus === "success"
            ? "bg-green-50 border border-green-500"
            : testStatus === "failed"
              ? "bg-red-50 border border-red-500"
              : "bg-blue-50 border border-blue-500"
        }`}
      >
        {#if testStatus === "success"}
          <h3 class="font-bold text-green-900 mb-2">✅ All Tests Passed!</h3>
          <p class="text-sm text-green-800">
            Your bet placement system is working correctly. If you still have
            issues on the market page, check the browser console for errors.
          </p>
        {:else if testStatus === "failed"}
          <h3 class="font-bold text-red-900 mb-2">❌ Tests Failed</h3>
          <p class="text-sm text-red-800">
            Check the logs below to see what went wrong. The error message will
            tell you how to fix it.
          </p>
        {:else}
          <h3 class="font-bold text-blue-900">⏳ Running tests...</h3>
        {/if}
      </div>
    {/if}

    <!-- Logs -->
    {#if logs.length > 0}
      <div
        class="bg-black text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-white">Console Logs:</h3>
          <span class="text-xs text-gray-400">{logs.length} entries</span>
        </div>
        {#each logs as logEntry}
          <div class="mb-1">{logEntry}</div>
        {/each}
      </div>
    {/if}

    <!-- Instructions -->
    <div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 class="font-semibold mb-2">📋 What This Tests:</h3>
      <ol class="text-sm space-y-1 ml-4 list-decimal">
        <li>Browser environment check</li>
        <li>Wallet connection status</li>
        <li>Firebase initialization</li>
        <li>Firestore data access (markets and options)</li>
        <li>
          Actual bet placement with <code class="bg-yellow-100 px-1"
            >placeBet()</code
          > function
        </li>
      </ol>

      <h3 class="font-semibold mt-4 mb-2">🔧 If Tests Fail:</h3>
      <ul class="text-sm space-y-1 ml-4 list-disc">
        <li>Check the error message in the logs</li>
        <li>
          Make sure your <code class="bg-yellow-100 px-1">.env</code> file has Firebase
          config
        </li>
        <li>Verify you have test AVAX in your wallet</li>
        <li>Check Firestore security rules allow writes</li>
        <li>
          See <a href="/TROUBLESHOOTING.md" class="underline"
            >TROUBLESHOOTING.md</a
          > for detailed fixes
        </li>
      </ul>
    </div>

    <!-- Back Link -->
    <div class="mt-6">
      <a href="/" class="text-blue-600 hover:underline">← Back to Markets</a>
    </div>
  </div>
</div>




