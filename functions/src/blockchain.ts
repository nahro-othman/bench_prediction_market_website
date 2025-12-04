/**
 * Blockchain Integration for Cloud Functions
 * Handles smart contract interactions from the backend
 */

import { ethers } from 'ethers';

// Contract ABIs
const PREDICTION_MARKET_ABI = [
  "function settleMarket(uint256 marketId, uint256 winningOption)",
  "function getMarket(uint256 marketId) view returns (uint256, string, string[], uint256[], uint256, uint256, uint8)",
];

const ORACLE_ABI = [
  "function submitData(bytes32 requestId, bytes data, bytes signature)",
  "function authorizeOracle(address oracle, bool status)"
];

// Configuration
const AVALANCHE_RPC = process.env.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const PREDICTION_MARKET_ADDRESS = process.env.PREDICTION_MARKET_CONTRACT || '';
const ORACLE_ADDRESS = process.env.ORACLE_CONTRACT || '';

/**
 * Get provider and signer
 */
export function getBlockchainProvider() {
  const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
  
  if (!PRIVATE_KEY) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY not configured');
  }
  
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  return { provider, wallet };
}

/**
 * Get PredictionMarket contract instance
 */
export function getPredictionMarketContract(withSigner = false) {
  if (!PREDICTION_MARKET_ADDRESS) {
    throw new Error('PREDICTION_MARKET_CONTRACT not configured');
  }
  
  const { provider, wallet } = getBlockchainProvider();
  return new ethers.Contract(
    PREDICTION_MARKET_ADDRESS,
    PREDICTION_MARKET_ABI,
    withSigner ? wallet : provider
  );
}

/**
 * Get Oracle contract instance
 */
export function getOracleContract(withSigner = false) {
  if (!ORACLE_ADDRESS) {
    throw new Error('ORACLE_CONTRACT not configured');
  }
  
  const { provider, wallet } = getBlockchainProvider();
  return new ethers.Contract(
    ORACLE_ADDRESS,
    ORACLE_ABI,
    withSigner ? wallet : provider
  );
}

/**
 * Settle market on blockchain
 */
export async function settleMarketOnChain(
  marketId: string,
  winningOption: number
): Promise<{ txHash: string; success: boolean }> {
  try {
    const contract = getPredictionMarketContract(true);
    const tx = await contract.settleMarket(marketId, winningOption);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      success: receipt.status === 1
    };
  } catch (error: any) {
    console.error('Error settling market on-chain:', error);
    throw new Error(`Failed to settle market: ${error.message}`);
  }
}

/**
 * Submit oracle data to blockchain
 */
export async function submitOracleData(
  requestId: string,
  data: any,
  signature: string
): Promise<{ txHash: string; success: boolean }> {
  try {
    const contract = getOracleContract(true);
    
    // Encode data as bytes
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string'],
      [JSON.stringify(data)]
    );
    
    const tx = await contract.submitData(requestId, encodedData, signature);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      success: receipt.status === 1
    };
  } catch (error: any) {
    console.error('Error submitting oracle data:', error);
    throw new Error(`Failed to submit oracle data: ${error.message}`);
  }
}

/**
 * Get market data from blockchain
 */
export async function getMarketFromChain(marketId: string) {
  try {
    const contract = getPredictionMarketContract();
    const result = await contract.getMarket(marketId);
    
    return {
      id: result[0].toString(),
      question: result[1],
      options: result[2],
      optionVolumes: result[3].map((v: any) => ethers.formatEther(v)),
      totalVolume: ethers.formatEther(result[4]),
      closeTime: Number(result[5]),
      status: Number(result[6])
    };
  } catch (error: any) {
    console.error('Error getting market from chain:', error);
    throw new Error(`Failed to get market: ${error.message}`);
  }
}

/**
 * Listen to blockchain events and sync with Firestore
 */
export function setupBlockchainListeners(onEvent: (event: any) => void) {
  const { provider } = getBlockchainProvider();
  const contract = new ethers.Contract(
    PREDICTION_MARKET_ADDRESS,
    PREDICTION_MARKET_ABI,
    provider
  );
  
  // Listen for market creation events
  contract.on('MarketCreated', (marketId, question, closeTime, event) => {
    onEvent({
      type: 'MarketCreated',
      marketId: marketId.toString(),
      question,
      closeTime: Number(closeTime),
      txHash: event.log.transactionHash
    });
  });
  
  // Listen for bet events
  contract.on('BetPlaced', (marketId, positionId, bettor, optionId, isYes, stake, event) => {
    onEvent({
      type: 'BetPlaced',
      marketId: marketId.toString(),
      positionId: positionId.toString(),
      bettor,
      optionId: Number(optionId),
      isYes,
      stake: ethers.formatEther(stake),
      txHash: event.log.transactionHash
    });
  });
  
  // Listen for settlement events
  contract.on('MarketSettled', (marketId, winningOption, event) => {
    onEvent({
      type: 'MarketSettled',
      marketId: marketId.toString(),
      winningOption: Number(winningOption),
      txHash: event.log.transactionHash
    });
  });
}

