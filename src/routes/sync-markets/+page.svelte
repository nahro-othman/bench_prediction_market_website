<script>
  import { getFirebaseFirestore } from "$lib/firebase";
  import { doc, setDoc, Timestamp } from "firebase/firestore";

  const MARKETS = [
    {
      id: "1",
      title: "Will Bitcoin hit $100k in 2025?",
      options: ["Yes", "No"],
      description:
        "Predict if Bitcoin will reach $100,000 by December 31, 2025",
      sport: "crypto",
      closeAt: new Date("2026-01-06T10:00:59.000Z"),
      txHash:
        "0xce45c73e33c13f60b00cd8582ffcc98e206fac3c9b0edd834d671f8a900d1bae",
    },
    {
      id: "2",
      title: "Champions League Winner 2024/25",
      options: ["Real Madrid", "Man City", "Bayern", "Other"],
      description: "Which club will win the UEFA Champions League this season?",
      sport: "football",
      closeAt: new Date("2026-06-05T10:01:04.000Z"),
      txHash:
        "0x2a37686daafa58556426455ad7f0a2784787a909a75d57dea4d4f57bc5a233ad",
    },
    {
      id: "3",
      title: "Will Mbappé score 30+ La Liga goals?",
      options: ["Yes", "No"],
      description:
        "Will Kylian Mbappé score 30 or more league goals in his first La Liga season?",
      sport: "football",
      closeAt: new Date("2026-05-06T10:01:11.000Z"),
      txHash:
        "0xec4badd833c98b8517e476c895f1cab036b5731a7efba4b4e572a24bc3c1ee67",
    },
    {
      id: "4",
      title: "World Cup 2026 Winner",
      options: ["Brazil", "France", "Argentina", "Other"],
      description:
        "Which national team will lift the FIFA World Cup trophy in 2026?",
      sport: "football",
      closeAt: new Date("2026-12-07T10:01:16.000Z"),
      txHash:
        "0x919141057903728f156b15367f8f9482fe222907626f17b5c9305b18a5b1deed",
    },
    {
      id: "5",
      title: "Will Ethereum reach $5,000 in 2025?",
      options: ["Yes", "No"],
      description: "Predict if Ethereum will hit $5,000 by end of 2025",
      sport: "crypto",
      closeAt: new Date("2026-02-05T10:01:21.000Z"),
      txHash:
        "0x1b0f56e44603a3eb9f62177e1c0b17a9ee8dc16e5e3868bd13e6723fc242a118",
    },
  ];

  let syncing = false;
  let logs = [];
  let completed = false;

  async function syncMarkets() {
    syncing = true;
    completed = false;
    logs = [];

    const db = getFirebaseFirestore();

    logs = [...logs, `🔄 Syncing ${MARKETS.length} markets to Firestore...`];

    for (const market of MARKETS) {
      logs = [...logs, `\n📝 Syncing Market ${market.id}: ${market.title}`];

      try {
        // Create market document
        const marketRef = doc(db, "markets", market.id);
        await setDoc(marketRef, {
          blockchainId: market.id,
          title: market.title,
          description: market.description,
          sport: market.sport,
          status: "open",
          resolution: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          closeAt: Timestamp.fromDate(market.closeAt),
          txHash: market.txHash,
        });

        logs = [...logs, `   ✅ Market document created`];

        // Create options
        for (let i = 0; i < market.options.length; i++) {
          const optionRef = doc(
            db,
            "markets",
            market.id,
            "options",
            i.toString()
          );
          await setDoc(optionRef, {
            label: market.options[i],
            probability: 1 / market.options.length,
            yesVolume: 0,
            noVolume: 0,
            order: i,
          });
        }

        logs = [...logs, `   ✅ ${market.options.length} options created`];
      } catch (error) {
        logs = [...logs, `   ❌ Failed: ${error.message}`];
      }
    }

    logs = [...logs, "\n🎉 All markets synced to Firestore!"];
    logs = [...logs, "\n✅ Go to homepage to see them!"];

    syncing = false;
    completed = true;
  }
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold mb-4">
        🔄 Sync Blockchain Markets to Firestore
      </h1>

      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p class="text-blue-700">
          This will sync {MARKETS.length} markets from the blockchain to Firestore.
        </p>
        <p class="text-blue-600 text-sm mt-2">
          Markets will be created with blockchain IDs (1, 2, 3, 4, 5) so you can
          bet with real AVAX!
        </p>
      </div>

      <button
        on:click={syncMarkets}
        disabled={syncing}
        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {#if syncing}
          ⏳ Syncing...
        {:else if completed}
          ✅ Synced! (Click to sync again)
        {:else}
          🚀 Sync Markets Now
        {/if}
      </button>

      {#if logs.length > 0}
        <div class="mt-8">
          <h2 class="text-xl font-bold mb-4">📋 Sync Log:</h2>
          <div
            class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96"
          >
            {#each logs as log}
              <div class="whitespace-pre-wrap">{log}</div>
            {/each}
          </div>
        </div>
      {/if}

      {#if completed}
        <div class="mt-6 bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700 font-semibold">🎉 Success!</p>
          <p class="text-green-600 mt-2">
            All markets have been synced to Firestore with blockchain IDs.
          </p>
          <a
            href="/"
            class="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            ← Go to Homepage
          </a>
        </div>
      {/if}

      <div class="mt-8 text-sm text-gray-600">
        <h3 class="font-semibold mb-2">📊 Markets to sync:</h3>
        <ul class="space-y-2">
          {#each MARKETS as market}
            <li class="flex items-start">
              <span class="font-mono bg-gray-100 px-2 py-1 rounded mr-2"
                >{market.id}</span
              >
              <span>{market.title}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</div>





