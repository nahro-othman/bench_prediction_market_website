/**
 * AI Service - Market Analysis & Insights
 * 
 * Demonstrates AI+Blockchain integration for Hack2Build hackathon
 */

export interface MarketInsight {
  marketId: string;
  confidence: number; // 0-1
  prediction: string;
  reasoning: string[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestedStake?: number;
}

export interface MarketSuggestion {
  title: string;
  description: string;
  options: string[];
  category: string;
  popularity: number;
}

/**
 * Analyze market sentiment and provide AI-powered insights
 */
export async function analyzeMarket(
  marketId: string,
  marketTitle: string,
  options: { label: string; probability: number }[]
): Promise<MarketInsight> {
  // Simulated AI analysis (in production, this would call an AI API)
  
  // Calculate confidence based on volume distribution
  const probabilities = options.map(o => o.probability);
  const maxProb = Math.max(...probabilities);
  const minProb = Math.min(...probabilities);
  const spread = maxProb - minProb;
  
  // Higher spread = higher confidence
  const confidence = Math.min(spread * 2, 1);
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (spread > 0.4) riskLevel = 'low';
  else if (spread > 0.2) riskLevel = 'medium';
  else riskLevel = 'high';
  
  // Find most likely outcome
  const topOption = options.reduce((prev, current) => 
    current.probability > prev.probability ? current : prev
  );
  
  // Generate reasoning
  const reasoning: string[] = [];
  
  if (spread > 0.4) {
    reasoning.push(`Strong market consensus favoring "${topOption.label}" (${(topOption.probability * 100).toFixed(0)}%)`);
  } else if (spread < 0.1) {
    reasoning.push(`Market is highly uncertain - all options have similar probabilities`);
    reasoning.push(`This presents both high risk and high reward potential`);
  } else {
    reasoning.push(`Moderate confidence in "${topOption.label}" outcome`);
  }
  
  // Add volatility insight
  const avgProbability = probabilities.reduce((a, b) => a + b, 0) / probabilities.length;
  const variance = probabilities.reduce((sum, p) => sum + Math.pow(p - avgProbability, 2), 0) / probabilities.length;
  
  if (variance > 0.05) {
    reasoning.push(`High variance detected - market may be volatile`);
  }
  
  // Suggest stake based on confidence and risk
  let suggestedStake: number | undefined;
  if (confidence > 0.7 && riskLevel === 'low') {
    suggestedStake = 100; // Higher stake for confident, low-risk bets
  } else if (confidence > 0.5 && riskLevel === 'medium') {
    suggestedStake = 50;
  } else {
    suggestedStake = 25; // Small stake for uncertain markets
  }
  
  return {
    marketId,
    confidence,
    prediction: topOption.label,
    reasoning,
    riskLevel,
    suggestedStake
  };
}

/**
 * Generate AI-powered market suggestions based on trends
 */
export async function suggestMarkets(): Promise<MarketSuggestion[]> {
  // In production, this would use:
  // 1. News API to find trending topics
  // 2. NLP to generate market questions
  // 3. Sentiment analysis for initial odds
  
  // Simulated suggestions for demo
  const currentDate = new Date();
  const suggestions: MarketSuggestion[] = [
    {
      title: "Will BTC break $100K by end of year?",
      description: "Bitcoin has been on a strong upward trend. Will it reach $100,000 before year end?",
      options: ["Yes", "No"],
      category: "Crypto",
      popularity: 0.85
    },
    {
      title: "Will Avalanche AVAX reach $50 this month?",
      description: "AVAX has shown strong momentum with increased ecosystem activity.",
      options: ["Yes", "No"],
      category: "Crypto",
      popularity: 0.72
    },
    {
      title: "Next major tech IPO in 2025?",
      description: "Which company will go public first in 2025?",
      options: ["OpenAI", "SpaceX", "Stripe", "Other"],
      category: "Tech",
      popularity: 0.68
    },
    {
      title: "Will AI replace 50% of coding jobs by 2030?",
      description: "As AI coding assistants improve, how will software development change?",
      options: ["Yes", "No", "Uncertain"],
      category: "AI & Tech",
      popularity: 0.91
    },
    {
      title: "Super Bowl 2026 Winner",
      description: "Early prediction market for next year's Super Bowl",
      options: ["Chiefs", "49ers", "Ravens", "Other"],
      category: "Sports",
      popularity: 0.64
    }
  ];
  
  // Sort by popularity
  return suggestions.sort((a, b) => b.popularity - a.popularity);
}

/**
 * Calculate optimal bet size using Kelly Criterion
 * https://en.wikipedia.org/wiki/Kelly_criterion
 */
export function calculateOptimalBet(
  bankroll: number,
  probability: number,
  odds: number
): number {
  // Kelly Criterion: f* = (bp - q) / b
  // where:
  // f* = fraction of bankroll to bet
  // b = odds received (decimal odds - 1)
  // p = probability of winning
  // q = probability of losing (1 - p)
  
  const b = odds - 1;
  const p = probability;
  const q = 1 - p;
  
  const kellyFraction = (b * p - q) / b;
  
  // Use fractional Kelly (safer - 25% of full Kelly)
  const conservativeKelly = Math.max(0, kellyFraction * 0.25);
  
  // Calculate bet size
  const betSize = Math.floor(bankroll * conservativeKelly);
  
  // Cap at 10% of bankroll (risk management)
  return Math.min(betSize, bankroll * 0.1);
}

/**
 * Analyze betting patterns and provide recommendations
 */
export interface BettingAnalysis {
  totalBets: number;
  winRate: number;
  avgStake: number;
  profitLoss: number;
  recommendation: string;
  insights: string[];
}

export async function analyzeBettingHistory(
  positions: {
    stake: number;
    payout: number | null;
    settled: boolean;
  }[]
): Promise<BettingAnalysis> {
  const settledPositions = positions.filter(p => p.settled);
  const totalBets = settledPositions.length;
  
  if (totalBets === 0) {
    return {
      totalBets: 0,
      winRate: 0,
      avgStake: 0,
      profitLoss: 0,
      recommendation: "Place your first bet to start tracking your performance!",
      insights: [
        "Start with small bets to test the platform",
        "Diversify across multiple markets",
        "Use AI insights to inform your decisions"
      ]
    };
  }
  
  const wins = settledPositions.filter(p => (p.payout || 0) > p.stake).length;
  const winRate = wins / totalBets;
  
  const avgStake = settledPositions.reduce((sum, p) => sum + p.stake, 0) / totalBets;
  
  const totalStaked = settledPositions.reduce((sum, p) => sum + p.stake, 0);
  const totalPayout = settledPositions.reduce((sum, p) => sum + (p.payout || 0), 0);
  const profitLoss = totalPayout - totalStaked;
  
  // Generate insights
  const insights: string[] = [];
  
  if (winRate > 0.6) {
    insights.push("🎉 Excellent win rate! You're doing great!");
  } else if (winRate < 0.4) {
    insights.push("⚠️ Win rate below 40% - consider using AI insights more");
  }
  
  if (avgStake > 100) {
    insights.push("💰 Your average bet size is high - ensure proper bankroll management");
  } else if (avgStake < 20) {
    insights.push("💡 Small bets are safe, but consider increasing stake on high-confidence bets");
  }
  
  if (profitLoss > 0) {
    insights.push(`📈 You're in profit! Total earnings: ${profitLoss.toFixed(2)} credits`);
  } else if (profitLoss < 0) {
    insights.push(`📉 Currently down ${Math.abs(profitLoss).toFixed(2)} credits - focus on value bets`);
  }
  
  // Generate recommendation
  let recommendation: string;
  if (winRate > 0.55 && profitLoss > 0) {
    recommendation = "Keep up the great work! Your strategy is working well.";
  } else if (winRate < 0.45) {
    recommendation = "Focus on markets with clear AI signals and avoid uncertain outcomes.";
  } else {
    recommendation = "You're on the right track. Stick to your strategy and use AI insights.";
  }
  
  return {
    totalBets,
    winRate,
    avgStake,
    profitLoss,
    recommendation,
    insights
  };
}

/**
 * Real-time market sentiment (simulated - would use social media APIs in production)
 */
export async function getMarketSentiment(marketTitle: string): Promise<{
  positive: number;
  negative: number;
  neutral: number;
  trending: boolean;
}> {
  // Simulate sentiment analysis
  const random = Math.random();
  
  return {
    positive: 0.3 + random * 0.4,
    negative: 0.2 + random * 0.2,
    neutral: 0.3 + random * 0.2,
    trending: random > 0.7
  };
}







