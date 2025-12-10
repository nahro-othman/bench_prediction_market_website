/**
 * Sync Markets Script
 * 
 * Run this in your browser console to sync blockchain markets to Firestore
 */

const MARKETS = [
  {
    id: "1",
    title: "Will Bitcoin hit $100k in 2025?",
    options: ["Yes", "No"],
    description: "Predict if Bitcoin will reach $100,000 by December 31, 2025",
    sport: "crypto",
    closeAt: new Date("2026-01-06T10:00:59.000Z"),
    txHash: "0xce45c73e33c13f60b00cd8582ffcc98e206fac3c9b0edd834d671f8a900d1bae"
  },
  {
    id: "2",
    title: "Champions League Winner 2024/25",
    options: ["Real Madrid", "Man City", "Bayern", "Other"],
    description: "Which club will win the UEFA Champions League this season?",
    sport: "football",
    closeAt: new Date("2026-06-05T10:01:04.000Z"),
    txHash: "0x2a37686daafa58556426455ad7f0a2784787a909a75d57dea4d4f57bc5a233ad"
  },
  {
    id: "3",
    title: "Will Mbappé score 30+ La Liga goals?",
    options: ["Yes", "No"],
    description: "Will Kylian Mbappé score 30 or more league goals in his first La Liga season?",
    sport: "football",
    closeAt: new Date("2026-05-06T10:01:11.000Z"),
    txHash: "0xec4badd833c98b8517e476c895f1cab036b5731a7efba4b4e572a24bc3c1ee67"
  },
  {
    id: "4",
    title: "World Cup 2026 Winner",
    options: ["Brazil", "France", "Argentina", "Other"],
    description: "Which national team will lift the FIFA World Cup trophy in 2026?",
    sport: "football",
    closeAt: new Date("2026-12-07T10:01:16.000Z"),
    txHash: "0x919141057903728f156b15367f8f9482fe222907626f17b5c9305b18a5b1deed"
  },
  {
    id: "5",
    title: "Will Ethereum reach $5,000 in 2025?",
    options: ["Yes", "No"],
    description: "Predict if Ethereum will hit $5,000 by end of 2025",
    sport: "crypto",
    closeAt: new Date("2026-02-05T10:01:21.000Z"),
    txHash: "0x1b0f56e44603a3eb9f62177e1c0b17a9ee8dc16e5e3868bd13e6723fc242a118"
  }
];

async function syncMarkets() {
  // Import Firebase
  const { getFirebaseFirestore } = await import('$lib/firebase');
  const { doc, setDoc, Timestamp } = await import('firebase/firestore');
  
  const db = getFirebaseFirestore();
  
  console.log(`🔄 Syncing ${MARKETS.length} markets to Firestore...`);
  
  for (const market of MARKETS) {
    console.log(`\n📝 Syncing Market ${market.id}: ${market.title}`);
    
    try {
      // Create market document
      const marketRef = doc(db, 'markets', market.id);
      await setDoc(marketRef, {
        blockchainId: market.id,
        title: market.title,
        description: market.description,
        sport: market.sport,
        status: 'open',
        resolution: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        closeAt: Timestamp.fromDate(market.closeAt),
        txHash: market.txHash
      });
      
      console.log(`   ✅ Market document created`);
      
      // Create options
      for (let i = 0; i < market.options.length; i++) {
        const optionRef = doc(db, 'markets', market.id, 'options', i.toString());
        await setDoc(optionRef, {
          label: market.options[i],
          probability: 1 / market.options.length,
          yesVolume: 0,
          noVolume: 0,
          order: i
        });
      }
      
      console.log(`   ✅ ${market.options.length} options created`);
      
    } catch (error) {
      console.error(`   ❌ Failed:`, error.message);
    }
  }
  
  console.log('\n🎉 All markets synced to Firestore!');
  console.log('\n✅ Refresh the page to see them!');
}

// Run it
syncMarkets();




