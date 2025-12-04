/**
 * Blockchain-Integrated Cloud Functions for Bench Prediction Market
 * 
 * This is the new blockchain-enabled version.
 * To use: rename this file to index.ts after deployment setup is complete
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { settleMarketOnChain, submitOracleData } from './blockchain';

admin.initializeApp();

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

const db = admin.firestore();

/**
 * Sync bet placement with blockchain
 * Frontend places bet on blockchain, then calls this to sync Firestore
 */
export const syncBetWithBlockchain = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const { marketId, optionId, side, stake, txHash, positionId } = request.data;

  try {
    // Verify transaction exists on blockchain (in production)
    console.log(`Syncing bet from tx: ${txHash}`);

    // Create position in Firestore
    const position = {
      userId: request.auth.uid,
      marketId,
      optionId,
      side,
      stake,
      txHash,
      blockchainPositionId: positionId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      settled: false,
      blockchain: true
    };

    const positionRef = await db.collection('positions').add(position);

    // Update market volumes
    const marketRef = db.collection('markets').doc(marketId);
    const optionRef = marketRef.collection('options').doc(optionId);
    
    const volumeField = side === 'yes' ? 'yesVolume' : 'noVolume';
    await optionRef.update({
      [volumeField]: admin.firestore.FieldValue.increment(stake)
    });

    return {
      success: true,
      firestorePositionId: positionRef.id
    };
  } catch (error) {
    console.error('Error syncing bet:', error);
    throw new HttpsError('internal', 'Failed to sync bet');
  }
});

/**
 * Settle market on blockchain and sync with Firestore
 */
export const settleMarketBlockchain = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin permissions
  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can settle markets');
  }

  const { marketId, winningOptionId } = request.data;

  try {
    // Settle on blockchain
    console.log(`Settling market ${marketId} on blockchain...`);
    const result = await settleMarketOnChain(marketId, parseInt(winningOptionId));

    // Update Firestore
    await db.collection('markets').doc(marketId).update({
      status: 'settled',
      resolution: winningOptionId,
      settlementTxHash: result.txHash,
      settledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update positions
    const positions = await db
      .collection('positions')
      .where('marketId', '==', marketId)
      .get();

    const batch = db.batch();
    positions.forEach((doc) => {
      const position = doc.data();
      const isWinner =
        (position.optionId === winningOptionId && position.side === 'yes') ||
        (position.optionId !== winningOptionId && position.side === 'no');

      batch.update(doc.ref, {
        settled: true,
        won: isWinner,
        settledAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    return {
      success: true,
      txHash: result.txHash
    };
  } catch (error) {
    console.error('Error settling market:', error);
    throw new HttpsError('internal', 'Failed to settle market');
  }
});

/**
 * Submit oracle data to blockchain
 */
export const submitOracleDataFunction = onRequest(async (req, res) => {
  try {
    const { requestId, dataSource, data } = req.body;

    if (!requestId || !dataSource) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // In production, verify API key or auth token
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ORACLE_API_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Sign the data (in production, use proper signing)
    const signature = '0x' + '00'.repeat(65);

    // Submit to blockchain
    const result = await submitOracleData(requestId, data, signature);

    res.json({
      success: true,
      txHash: result.txHash
    });
  } catch (error) {
    console.error('Error submitting oracle data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Auto-close markets that have passed their close time
 */
export const autoCloseMarkets = onRequest(async (req, res) => {
  try {
    const now = Date.now();

    const markets = await db
      .collection('markets')
      .where('status', '==', 'open')
      .get();

    const batch = db.batch();
    let closedCount = 0;

    markets.forEach((doc) => {
      const market = doc.data();
      const closeTime = market.closeAt?.toDate?.()?.getTime() || 0;

      if (closeTime <= now) {
        batch.update(doc.ref, {
          status: 'closed',
          closedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        closedCount++;
      }
    });

    await batch.commit();

    res.json({
      success: true,
      closedCount
    });
  } catch (error) {
    console.error('Error auto-closing markets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Firestore trigger: Log when markets are created
 */
export const onMarketCreated = onDocumentCreated('markets/{marketId}', async (event) => {
  const marketData = event.data?.data();
  console.log(`Market created: ${marketData?.title}`);
  
  // In production, you could:
  // - Create market on blockchain
  // - Send notifications
  // - Generate AI insights
});

/**
 * Firestore trigger: Handle market updates
 */
export const onMarketUpdated = onDocumentUpdated('markets/{marketId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (before?.status !== 'settled' && after?.status === 'settled') {
    console.log(`Market ${event.params.marketId} settled`);
    
    // Trigger post-settlement automation
    // - Generate AI insights
    // - Notify users
    // - Create related markets
  }
});

