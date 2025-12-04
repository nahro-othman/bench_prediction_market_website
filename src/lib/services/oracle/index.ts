/**
 * Oracle Service
 * Handles external data fetching and verification for market settlement
 */

import { oracleContract } from '../web3/contracts';

export interface OracleDataSource {
  id: string;
  name: string;
  type: 'sports' | 'weather' | 'crypto' | 'custom';
  endpoint?: string;
}

export interface OracleRequest {
  id: string;
  dataSource: string;
  marketId: string;
  status: 'pending' | 'fulfilled' | 'failed';
  data?: any;
  requestedAt: number;
  fulfilledAt?: number;
}

/**
 * Request external data from oracle
 */
export async function requestOracleData(
  dataSource: string,
  marketId: string
): Promise<{ requestId: string; txHash: string }> {
  try {
    const result = await oracleContract.requestData(dataSource);
    
    // Store request in Firestore for tracking
    // (In production, use Firebase SDK)
    console.log(`Oracle data requested: ${result.requestId}`);
    
    return result;
  } catch (error) {
    console.error('Error requesting oracle data:', error);
    throw error;
  }
}

/**
 * Check if oracle request is fulfilled
 */
export async function checkOracleRequest(requestId: string): Promise<boolean> {
  try {
    return await oracleContract.isRequestFulfilled(requestId);
  } catch (error) {
    console.error('Error checking oracle request:', error);
    return false;
  }
}

/**
 * Get oracle data once fulfilled
 */
export async function getOracleData(requestId: string): Promise<any> {
  try {
    const data = await oracleContract.getRequestData(requestId);
    
    // Decode data (in production, parse properly)
    return data;
  } catch (error) {
    console.error('Error getting oracle data:', error);
    throw error;
  }
}

/**
 * Mock oracle data sources for demo
 */
export const MOCK_DATA_SOURCES: OracleDataSource[] = [
  {
    id: 'sports_nfl_game_123',
    name: 'NFL Game Result',
    type: 'sports',
    endpoint: 'https://api.sportsdata.io/v3/nfl/scores/json/GamesByDate/2024-12-04'
  },
  {
    id: 'crypto_btc_price',
    name: 'Bitcoin Price',
    type: 'crypto',
    endpoint: 'https://api.coinbase.com/v2/prices/BTC-USD/spot'
  },
  {
    id: 'weather_sf_temp',
    name: 'San Francisco Temperature',
    type: 'weather',
    endpoint: 'https://api.weather.gov/gridpoints/MTR/85,105/forecast'
  }
];

/**
 * Fetch data from external source (for oracle submission)
 * This would typically run on the backend
 */
export async function fetchExternalData(dataSource: OracleDataSource): Promise<any> {
  if (!dataSource.endpoint) {
    throw new Error('No endpoint configured for data source');
  }

  try {
    const response = await fetch(dataSource.endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching external data:', error);
    throw error;
  }
}

/**
 * AI-powered data verification
 * Uses AI to verify and interpret external data
 */
export async function verifyDataWithAI(data: any, context: string): Promise<{
  verified: boolean;
  confidence: number;
  interpretation: string;
}> {
  // In production, call AI service (OpenAI, Anthropic, etc.)
  // For demo, return mock verification
  
  console.log('Verifying data with AI:', { data, context });
  
  return {
    verified: true,
    confidence: 0.95,
    interpretation: 'Data verified and interpreted successfully'
  };
}

/**
 * Complete oracle workflow: request -> wait -> fetch -> verify -> submit
 */
export async function completeOracleWorkflow(
  dataSource: OracleDataSource,
  marketId: string
): Promise<{
  requestId: string;
  data: any;
  verified: boolean;
}> {
  // 1. Request data on-chain
  const { requestId } = await requestOracleData(dataSource.id, marketId);
  
  // 2. Fetch external data
  const externalData = await fetchExternalData(dataSource);
  
  // 3. Verify with AI
  const verification = await verifyDataWithAI(
    externalData,
    `Market ${marketId} settlement data`
  );
  
  // 4. Submit to oracle contract (via Cloud Function)
  // This step requires backend/oracle node
  console.log('Data ready for oracle submission:', {
    requestId,
    data: externalData,
    verification
  });
  
  return {
    requestId,
    data: externalData,
    verified: verification.verified
  };
}

