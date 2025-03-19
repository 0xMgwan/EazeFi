const StellarSdk = require('stellar-sdk');
const { server } = require('./stellar');

/**
 * Get the best path for a payment from one asset to another
 * @param {string} sourceAssetCode - Source asset code (e.g., 'USD')
 * @param {string} sourceAssetIssuer - Source asset issuer public key
 * @param {string} destAssetCode - Destination asset code (e.g., 'EUR')
 * @param {string} destAssetIssuer - Destination asset issuer public key
 * @param {string} amount - Amount to exchange
 * @returns {Promise<Object>} - Path payment details
 */
const findBestPath = async (sourceAssetCode, sourceAssetIssuer, destAssetCode, destAssetIssuer, amount) => {
  try {
    // Create asset objects
    let sourceAsset, destAsset;
    
    if (sourceAssetCode === 'XLM') {
      sourceAsset = StellarSdk.Asset.native();
    } else {
      sourceAsset = new StellarSdk.Asset(sourceAssetCode, sourceAssetIssuer);
    }
    
    if (destAssetCode === 'XLM') {
      destAsset = StellarSdk.Asset.native();
    } else {
      destAsset = new StellarSdk.Asset(destAssetCode, destAssetIssuer);
    }

    // Find paths using Stellar's strictSendPaths
    const paths = await server.strictSendPaths(
      sourceAsset,
      amount.toString(),
      [destAsset]
    ).call();

    if (!paths.records || paths.records.length === 0) {
      throw new Error('No payment path found');
    }

    // Return the best path (first one)
    const bestPath = paths.records[0];
    return {
      sourceAmount: bestPath.source_amount,
      destAmount: bestPath.destination_amount,
      path: bestPath.path,
      sourceAsset,
      destAsset
    };
  } catch (error) {
    console.error('Error finding path:', error);
    throw error;
  }
};

/**
 * Execute a path payment (swap) on SDEX
 * @param {string} senderSecret - Sender's secret key
 * @param {string} sourceAssetCode - Source asset code
 * @param {string} sourceAssetIssuer - Source asset issuer
 * @param {string} destAssetCode - Destination asset code
 * @param {string} destAssetIssuer - Destination asset issuer
 * @param {string} sendAmount - Amount to send
 * @param {string} minDestAmount - Minimum amount to receive
 * @param {Array} path - Path of assets to use for the swap
 * @returns {Promise<Object>} - Transaction result
 */
const executeSwap = async (senderSecret, sourceAssetCode, sourceAssetIssuer, destAssetCode, destAssetIssuer, sendAmount, minDestAmount, path = []) => {
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    // Load account details
    const account = await server.loadAccount(sourcePublicKey);
    
    // Create the asset objects
    let sendingAsset, destinationAsset;
    
    if (sourceAssetCode === 'XLM') {
      sendingAsset = StellarSdk.Asset.native();
    } else {
      sendingAsset = new StellarSdk.Asset(sourceAssetCode, sourceAssetIssuer);
    }
    
    if (destAssetCode === 'XLM') {
      destinationAsset = StellarSdk.Asset.native();
    } else {
      destinationAsset = new StellarSdk.Asset(destAssetCode, destAssetIssuer);
    }

    // Create the path payment transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_NETWORK === 'TESTNET' 
        ? StellarSdk.Networks.TESTNET 
        : StellarSdk.Networks.PUBLIC
    })
      .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: sendingAsset,
        sendAmount: sendAmount.toString(),
        destination: sourcePublicKey, // Send back to the same account
        destAsset: destinationAsset,
        destMin: minDestAmount.toString(),
        path: path // Use the path from findBestPath
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(sourceKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error executing swap:', error);
    throw error;
  }
};

/**
 * Get current market price between two assets
 * @param {string} baseAssetCode - Base asset code
 * @param {string} baseAssetIssuer - Base asset issuer
 * @param {string} counterAssetCode - Counter asset code
 * @param {string} counterAssetIssuer - Counter asset issuer
 * @returns {Promise<Object>} - Market price details
 */
const getMarketPrice = async (baseAssetCode, baseAssetIssuer, counterAssetCode, counterAssetIssuer) => {
  try {
    // Create asset objects
    let baseAsset, counterAsset;
    
    if (baseAssetCode === 'XLM') {
      baseAsset = StellarSdk.Asset.native();
    } else {
      baseAsset = new StellarSdk.Asset(baseAssetCode, baseAssetIssuer);
    }
    
    if (counterAssetCode === 'XLM') {
      counterAsset = StellarSdk.Asset.native();
    } else {
      counterAsset = new StellarSdk.Asset(counterAssetCode, counterAssetIssuer);
    }

    // Get orderbook to determine current price
    const orderbook = await server.orderbook(baseAsset, counterAsset).call();
    
    if (!orderbook.bids || orderbook.bids.length === 0) {
      throw new Error('No market data available');
    }

    // Get the best bid price
    const bestBid = orderbook.bids[0];
    
    return {
      price: bestBid.price,
      baseAsset: `${baseAssetCode}${baseAssetIssuer ? `-${baseAssetIssuer.substring(0, 4)}` : ''}`,
      counterAsset: `${counterAssetCode}${counterAssetIssuer ? `-${counterAssetIssuer.substring(0, 4)}` : ''}`,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting market price:', error);
    throw error;
  }
};

/**
 * Get available liquidity for a pair
 * @param {string} baseAssetCode - Base asset code
 * @param {string} baseAssetIssuer - Base asset issuer
 * @param {string} counterAssetCode - Counter asset code
 * @param {string} counterAssetIssuer - Counter asset issuer
 * @returns {Promise<Object>} - Liquidity information
 */
const getLiquidity = async (baseAssetCode, baseAssetIssuer, counterAssetCode, counterAssetIssuer) => {
  try {
    // Create asset objects
    let baseAsset, counterAsset;
    
    if (baseAssetCode === 'XLM') {
      baseAsset = StellarSdk.Asset.native();
    } else {
      baseAsset = new StellarSdk.Asset(baseAssetCode, baseAssetIssuer);
    }
    
    if (counterAssetCode === 'XLM') {
      counterAsset = StellarSdk.Asset.native();
    } else {
      counterAsset = new StellarSdk.Asset(counterAssetCode, counterAssetIssuer);
    }

    // Get orderbook to determine liquidity
    const orderbook = await server.orderbook(baseAsset, counterAsset).limit(50).call();
    
    if (!orderbook.bids || orderbook.bids.length === 0) {
      throw new Error('No market data available');
    }

    // Calculate total liquidity from bids and asks
    let bidLiquidity = 0;
    let askLiquidity = 0;
    
    orderbook.bids.forEach(bid => {
      bidLiquidity += parseFloat(bid.amount);
    });
    
    orderbook.asks.forEach(ask => {
      askLiquidity += parseFloat(ask.amount);
    });
    
    return {
      bidLiquidity,
      askLiquidity,
      totalLiquidity: bidLiquidity + askLiquidity,
      spreadPercentage: ((parseFloat(orderbook.asks[0].price) - parseFloat(orderbook.bids[0].price)) / parseFloat(orderbook.bids[0].price)) * 100,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting liquidity:', error);
    throw error;
  }
};

/**
 * Create a market order (swap at market price)
 * @param {string} senderSecret - Sender's secret key
 * @param {string} sellAssetCode - Asset to sell
 * @param {string} sellAssetIssuer - Sell asset issuer
 * @param {string} buyAssetCode - Asset to buy
 * @param {string} buyAssetIssuer - Buy asset issuer
 * @param {string} amount - Amount to sell
 * @returns {Promise<Object>} - Transaction result
 */
const createMarketOrder = async (senderSecret, sellAssetCode, sellAssetIssuer, buyAssetCode, buyAssetIssuer, amount) => {
  try {
    // First find the best path
    const pathInfo = await findBestPath(
      sellAssetCode, 
      sellAssetIssuer, 
      buyAssetCode, 
      buyAssetIssuer, 
      amount
    );
    
    // Calculate minimum destination amount with 1% slippage tolerance
    const minDestAmount = parseFloat(pathInfo.destAmount) * 0.99;
    
    // Execute the swap
    return await executeSwap(
      senderSecret,
      sellAssetCode,
      sellAssetIssuer,
      buyAssetCode,
      buyAssetIssuer,
      amount,
      minDestAmount.toString(),
      pathInfo.path
    );
  } catch (error) {
    console.error('Error creating market order:', error);
    throw error;
  }
};

module.exports = {
  findBestPath,
  executeSwap,
  getMarketPrice,
  getLiquidity,
  createMarketOrder
};
