/**
 * Automated Market Maker (AMM) Pricing
 * Implements constant product formula for dynamic odds
 */

export interface AMMPool {
  yesShares: number;
  noShares: number;
  k: number; // Constant product
  liquidity: number;
}

/**
 * Initialize AMM pool with equal liquidity
 */
export function initializePool(initialLiquidity: number = 1000): AMMPool {
  const shares = initialLiquidity / 2;
  return {
    yesShares: shares,
    noShares: shares,
    k: shares * shares,
    liquidity: initialLiquidity
  };
}

/**
 * Calculate current probability from pool state
 * Uses constant product formula: x * y = k
 */
export function calculateProbability(pool: AMMPool): number {
  const total = pool.yesShares + pool.noShares;
  return pool.yesShares / total;
}

/**
 * Calculate price impact of a bet
 * Returns new probability after bet is placed
 */
export function calculatePriceImpact(
  pool: AMMPool,
  betSide: 'yes' | 'no',
  betAmount: number
): {
  newProbability: number;
  oldProbability: number;
  priceImpact: number;
  shares: number;
  avgPrice: number;
} {
  const oldProbability = calculateProbability(pool);
  
  let newYesShares: number;
  let newNoShares: number;
  let shares: number;
  
  if (betSide === 'yes') {
    // Add liquidity to yes side
    newYesShares = pool.yesShares + betAmount;
    // Calculate new no shares to maintain k
    newNoShares = pool.k / newYesShares;
    // Shares received
    shares = pool.noShares - newNoShares;
  } else {
    // Add liquidity to no side
    newNoShares = pool.noShares + betAmount;
    // Calculate new yes shares to maintain k
    newYesShares = pool.k / newNoShares;
    // Shares received
    shares = pool.yesShares - newYesShares;
  }
  
  const newProbability = newYesShares / (newYesShares + newNoShares);
  const priceImpact = Math.abs(newProbability - oldProbability);
  const avgPrice = betAmount / shares;
  
  return {
    newProbability,
    oldProbability,
    priceImpact,
    shares,
    avgPrice
  };
}

/**
 * Execute bet and update pool
 */
export function executeBet(
  pool: AMMPool,
  betSide: 'yes' | 'no',
  betAmount: number
): {
  updatedPool: AMMPool;
  shares: number;
  avgPrice: number;
} {
  const impact = calculatePriceImpact(pool, betSide, betAmount);
  
  let newYesShares: number;
  let newNoShares: number;
  
  if (betSide === 'yes') {
    newYesShares = pool.yesShares + betAmount;
    newNoShares = pool.k / newYesShares;
  } else {
    newNoShares = pool.noShares + betAmount;
    newYesShares = pool.k / newNoShares;
  }
  
  return {
    updatedPool: {
      yesShares: newYesShares,
      noShares: newNoShares,
      k: newYesShares * newNoShares,
      liquidity: pool.liquidity + betAmount
    },
    shares: impact.shares,
    avgPrice: impact.avgPrice
  };
}

/**
 * Calculate optimal bet size to move probability to target
 */
export function calculateBetForTarget(
  pool: AMMPool,
  targetProbability: number,
  side: 'yes' | 'no'
): number {
  const currentProb = calculateProbability(pool);
  
  // Cannot move probability in wrong direction
  if (
    (side === 'yes' && targetProbability < currentProb) ||
    (side === 'no' && targetProbability > currentProb)
  ) {
    return 0;
  }
  
  // Calculate required shares
  const targetYesShares = targetProbability * (pool.yesShares + pool.noShares);
  const targetNoShares = (1 - targetProbability) * (pool.yesShares + pool.noShares);
  
  if (side === 'yes') {
    // Calculate bet needed to reach target yes shares
    const newNoShares = pool.k / targetYesShares;
    const betAmount = targetYesShares - pool.yesShares;
    return Math.max(0, betAmount);
  } else {
    // Calculate bet needed to reach target no shares
    const newYesShares = pool.k / targetNoShares;
    const betAmount = targetNoShares - pool.noShares;
    return Math.max(0, betAmount);
  }
}

/**
 * Calculate expected payout for a bet
 */
export function calculateExpectedPayout(
  shares: number,
  probability: number,
  side: 'yes' | 'no'
): number {
  const winProbability = side === 'yes' ? probability : 1 - probability;
  
  // Each share is worth 1 unit if outcome wins
  const maxPayout = shares * 1;
  
  // Expected value
  return maxPayout * winProbability;
}

/**
 * Get current odds (decimal format)
 */
export function getOdds(pool: AMMPool): {
  yesOdds: number;
  noOdds: number;
  yesImplied: number;
  noImplied: number;
} {
  const probability = calculateProbability(pool);
  
  // Decimal odds = 1 / probability
  const yesOdds = 1 / probability;
  const noOdds = 1 / (1 - probability);
  
  return {
    yesOdds,
    noOdds,
    yesImplied: probability,
    noImplied: 1 - probability
  };
}

/**
 * Calculate liquidity depth (how much can be bet with <5% slippage)
 */
export function calculateLiquidityDepth(
  pool: AMMPool,
  maxSlippage: number = 0.05
): {
  yesDepth: number;
  noDepth: number;
} {
  const currentProb = calculateProbability(pool);
  
  // Binary search for max bet size with acceptable slippage
  function findMaxBet(side: 'yes' | 'no'): number {
    let low = 0;
    let high = pool.liquidity;
    let maxBet = 0;
    
    while (high - low > 1) {
      const mid = (low + high) / 2;
      const impact = calculatePriceImpact(pool, side, mid);
      
      if (impact.priceImpact <= maxSlippage) {
        maxBet = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    
    return maxBet;
  }
  
  return {
    yesDepth: findMaxBet('yes'),
    noDepth: findMaxBet('no')
  };
}

/**
 * Simulate multiple bets and return final pool state
 */
export function simulateBets(
  initialPool: AMMPool,
  bets: { side: 'yes' | 'no'; amount: number }[]
): {
  finalPool: AMMPool;
  finalProbability: number;
  totalVolume: number;
  priceHistory: number[];
} {
  let pool = { ...initialPool };
  let totalVolume = 0;
  const priceHistory: number[] = [calculateProbability(pool)];
  
  for (const bet of bets) {
    const result = executeBet(pool, bet.side, bet.amount);
    pool = result.updatedPool;
    totalVolume += bet.amount;
    priceHistory.push(calculateProbability(pool));
  }
  
  return {
    finalPool: pool,
    finalProbability: calculateProbability(pool),
    totalVolume,
    priceHistory
  };
}

/**
 * Calculate arbitrage opportunity between market and true odds
 */
export function calculateArbitrage(
  marketProbability: number,
  trueProbability: number
): {
  hasArbitrage: boolean;
  expectedValue: number;
  recommendation: 'buy_yes' | 'buy_no' | 'none';
} {
  const diff = trueProbability - marketProbability;
  const threshold = 0.05; // 5% edge
  
  if (diff > threshold) {
    return {
      hasArbitrage: true,
      expectedValue: diff,
      recommendation: 'buy_yes'
    };
  } else if (diff < -threshold) {
    return {
      hasArbitrage: true,
      expectedValue: Math.abs(diff),
      recommendation: 'buy_no'
    };
  }
  
  return {
    hasArbitrage: false,
    expectedValue: 0,
    recommendation: 'none'
  };
}












