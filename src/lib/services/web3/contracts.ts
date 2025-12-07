/**
 * Smart Contract Interaction Service
 * Handles all interactions with Avalanche contracts
 */

import { ethers } from 'ethers';
import { get } from 'svelte/store';
import { walletStore } from './auth';
import { CONTRACT_ADDRESSES as CONFIG_ADDRESSES } from '$lib/config';

// Contract ABIs (simplified - include full ABIs from artifacts in production)
const PREDICTION_MARKET_ABI = [
  "function createMarket(string question, string[] options, uint256 closeTime) returns (uint256)",
  "function placeBet(uint256 marketId, uint256 optionId, bool isYes, uint256 amount) payable returns (uint256)",
  "function getMarket(uint256 marketId) view returns (uint256, string, string[], uint256[], uint256, uint256, uint8)",
  "function getUserPositions(address user) view returns (uint256[])",
  "function calculatePayout(uint256 positionId) view returns (uint256)",
  "function claimPayout(uint256 positionId)",
  "function settleMarket(uint256 marketId, uint256 winningOption)",
  "function marketCount() view returns (uint256)",
  "event MarketCreated(uint256 indexed marketId, string question, uint256 closeTime)",
  "event BetPlaced(uint256 indexed marketId, uint256 indexed positionId, address indexed bettor, uint256 optionId, bool isYes, uint256 stake)"
];

const X402_PAYMENT_ABI = [
  "function initiatePayment(address recipient, uint256 amount, bytes metadata) payable returns (bytes32)",
  "function getPayment(bytes32 paymentId) view returns (address, address, uint256, uint8, uint256)",
  "function totalPayments() view returns (uint256)",
  "function totalVolume() view returns (uint256)",
  "event PaymentInitiated(bytes32 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount)",
  "event PaymentCompleted(bytes32 indexed paymentId, uint256 amount)"
];

const ERC8004_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function conditionalTransfer(address to, uint256 amount, bytes condition) returns (bool)",
  "function scheduleTransfer(address to, uint256 amount, uint256 unlockTime) returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event ConditionalTransfer(address indexed from, address indexed to, uint256 amount, bytes condition)"
];

// Contract addresses - using config file instead of env vars (more reliable!)
const CONTRACT_ADDRESSES = CONFIG_ADDRESSES;

/**
 * Get contract instance
 */
function getContract(address: string, abi: any[], withSigner = false) {
  const wallet = get(walletStore);
  
  if (!wallet.provider) {
    throw new Error('Wallet not connected');
  }

  if (withSigner && wallet.signer) {
    return new ethers.Contract(address, abi, wallet.signer);
  }

  return new ethers.Contract(address, abi, wallet.provider);
}

/**
 * PredictionMarket Contract Functions
 */
export const predictionMarketContract = {
  /**
   * Create a new market
   */
  async createMarket(question: string, options: string[], closeTime: number): Promise<{ marketId: string; txHash: string }> {
    if (!CONTRACT_ADDRESSES.PREDICTION_MARKET) {
      throw new Error('PredictionMarket contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI, true);
    const tx = await contract.createMarket(question, options, closeTime);
    const receipt = await tx.wait();
    
    // Parse event to get marketId
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'MarketCreated';
      } catch {
        return false;
      }
    });

    const marketId = event ? contract.interface.parseLog(event).args[0].toString() : '0';

    return {
      marketId,
      txHash: receipt.hash
    };
  },

  /**
   * Place a bet on a market
   */
  async placeBet(
    marketId: string,
    optionId: number,
    isYes: boolean,
    amount: string
  ): Promise<{ positionId: string; txHash: string }> {
    if (!CONTRACT_ADDRESSES.PREDICTION_MARKET) {
      throw new Error('PredictionMarket contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI, true);
    const amountWei = ethers.parseEther(amount);
    
    const tx = await contract.placeBet(marketId, optionId, isYes, amountWei, {
      value: amountWei
    });
    const receipt = await tx.wait();
    
    // Parse event to get positionId
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'BetPlaced';
      } catch {
        return false;
      }
    });

    const positionId = event ? contract.interface.parseLog(event).args[1].toString() : '0';

    return {
      positionId,
      txHash: receipt.hash
    };
  },

  /**
   * Get market details
   */
  async getMarket(marketId: string) {
    if (!CONTRACT_ADDRESSES.PREDICTION_MARKET) {
      throw new Error('PredictionMarket contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI);
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
  },

  /**
   * Get user positions
   */
  async getUserPositions(address: string): Promise<string[]> {
    if (!CONTRACT_ADDRESSES.PREDICTION_MARKET) {
      return [];
    }

    const contract = getContract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI);
    const positions = await contract.getUserPositions(address);
    return positions.map((p: any) => p.toString());
  },

  /**
   * Calculate payout for position
   */
  async calculatePayout(positionId: string): Promise<string> {
    if (!CONTRACT_ADDRESSES.PREDICTION_MARKET) {
      throw new Error('PredictionMarket contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI);
    const payout = await contract.calculatePayout(positionId);
    return ethers.formatEther(payout);
  },

  /**
   * Claim payout
   */
  async claimPayout(positionId: string): Promise<string> {
    if (!CONTRACT_ADDRESSES.PREDICTION_MARKET) {
      throw new Error('PredictionMarket contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI, true);
    const tx = await contract.claimPayout(positionId);
    const receipt = await tx.wait();
    return receipt.hash;
  }
};

/**
 * x402 Payment Contract Functions
 */
export const x402Contract = {
  /**
   * Get payment details
   */
  async getPayment(paymentId: string) {
    if (!CONTRACT_ADDRESSES.X402_PAYMENT) {
      throw new Error('X402Payment contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.X402_PAYMENT, X402_PAYMENT_ABI);
    const result = await contract.getPayment(paymentId);
    
    return {
      sender: result[0],
      recipient: result[1],
      amount: ethers.formatEther(result[2]),
      status: Number(result[3]),
      timestamp: Number(result[4])
    };
  },

  /**
   * Get total stats
   */
  async getStats() {
    if (!CONTRACT_ADDRESSES.X402_PAYMENT) {
      return { totalPayments: '0', totalVolume: '0' };
    }

    const contract = getContract(CONTRACT_ADDRESSES.X402_PAYMENT, X402_PAYMENT_ABI);
    const [totalPayments, totalVolume] = await Promise.all([
      contract.totalPayments(),
      contract.totalVolume()
    ]);
    
    return {
      totalPayments: totalPayments.toString(),
      totalVolume: ethers.formatEther(totalVolume)
    };
  }
};

/**
 * Token Contract Functions
 */
export const tokenContract = {
  /**
   * Get token balance
   */
  async getBalance(address: string): Promise<string> {
    if (!CONTRACT_ADDRESSES.TOKEN) {
      return '0';
    }

    const contract = getContract(CONTRACT_ADDRESSES.TOKEN, ERC8004_TOKEN_ABI);
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  },

  /**
   * Transfer tokens
   */
  async transfer(to: string, amount: string): Promise<string> {
    if (!CONTRACT_ADDRESSES.TOKEN) {
      throw new Error('Token contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.TOKEN, ERC8004_TOKEN_ABI, true);
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.transfer(to, amountWei);
    const receipt = await tx.wait();
    return receipt.hash;
  },

  /**
   * Schedule transfer
   */
  async scheduleTransfer(to: string, amount: string, unlockTime: number): Promise<{ transferId: string; txHash: string }> {
    if (!CONTRACT_ADDRESSES.TOKEN) {
      throw new Error('Token contract not deployed yet');
    }

    const contract = getContract(CONTRACT_ADDRESSES.TOKEN, ERC8004_TOKEN_ABI, true);
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.scheduleTransfer(to, amountWei, unlockTime);
    const receipt = await tx.wait();
    
    // Extract transferId from events
    const transferId = '1'; // Parse from events in production
    
    return {
      transferId,
      txHash: receipt.hash
    };
  }
};

// Export contract addresses for reference
export { CONTRACT_ADDRESSES };

