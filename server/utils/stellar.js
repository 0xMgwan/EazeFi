const StellarSdk = require('stellar-sdk');

// Configure Stellar network (testnet or public)
const setupStellarNetwork = () => {
  if (process.env.STELLAR_NETWORK === 'TESTNET') {
    StellarSdk.Network.useTestNetwork();
    return new StellarSdk.Server('https://horizon-testnet.stellar.org');
  } else {
    StellarSdk.Network.usePublicNetwork();
    return new StellarSdk.Server('https://horizon.stellar.org');
  }
};

const server = setupStellarNetwork();

// Create a new Stellar account
const createStellarAccount = async () => {
  try {
    // Generate a new keypair
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();

    // For testnet, fund the account using friendbot
    if (process.env.STELLAR_NETWORK === 'TESTNET') {
      await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    }

    return {
      publicKey,
      secretKey
    };
  } catch (error) {
    console.error('Error creating Stellar account:', error);
    throw error;
  }
};

// Create a trustline for an asset
const createTrustline = async (accountSecret, assetCode, assetIssuer) => {
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(accountSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    // Load account details
    const account = await server.loadAccount(sourcePublicKey);
    
    // Create the asset object
    const asset = new StellarSdk.Asset(assetCode, assetIssuer);

    // Create the trustline transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_NETWORK === 'TESTNET' 
        ? StellarSdk.Networks.TESTNET 
        : StellarSdk.Networks.PUBLIC
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset,
        limit: '1000000' // Set an appropriate limit
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(sourceKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error creating trustline:', error);
    throw error;
  }
};

// Send a payment
const sendPayment = async (senderSecret, receiverPublicKey, amount, assetCode, assetIssuer) => {
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    // Load account details
    const account = await server.loadAccount(sourcePublicKey);
    
    // Create the asset object (XLM or custom asset)
    let asset;
    if (assetCode === 'XLM' && !assetIssuer) {
      asset = StellarSdk.Asset.native();
    } else {
      asset = new StellarSdk.Asset(assetCode, assetIssuer);
    }

    // Create the payment transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_NETWORK === 'TESTNET' 
        ? StellarSdk.Networks.TESTNET 
        : StellarSdk.Networks.PUBLIC
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: receiverPublicKey,
        asset,
        amount: amount.toString()
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(sourceKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error sending payment:', error);
    throw error;
  }
};

// Get account balances
const getAccountBalances = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances;
  } catch (error) {
    console.error('Error getting account balances:', error);
    throw error;
  }
};

// Create a path payment (currency swap)
const createPathPayment = async (senderSecret, receiverPublicKey, sendAmount, sendAsset, destAmount, destAsset) => {
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    // Load account details
    const account = await server.loadAccount(sourcePublicKey);
    
    // Create the asset objects
    let sendingAsset, destinationAsset;
    
    if (sendAsset.code === 'XLM') {
      sendingAsset = StellarSdk.Asset.native();
    } else {
      sendingAsset = new StellarSdk.Asset(sendAsset.code, sendAsset.issuer);
    }
    
    if (destAsset.code === 'XLM') {
      destinationAsset = StellarSdk.Asset.native();
    } else {
      destinationAsset = new StellarSdk.Asset(destAsset.code, destAsset.issuer);
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
        destination: receiverPublicKey,
        destAsset: destinationAsset,
        destMin: destAmount.toString(),
        path: [] // Let Stellar find the path
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(sourceKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error creating path payment:', error);
    throw error;
  }
};

// Get exchange rate between two assets
const getExchangeRate = async (sourceAsset, destAsset, amount) => {
  try {
    // Create the asset objects
    let sendingAsset, destinationAsset;
    
    if (sourceAsset.code === 'XLM') {
      sendingAsset = StellarSdk.Asset.native();
    } else {
      sendingAsset = new StellarSdk.Asset(sourceAsset.code, sourceAsset.issuer);
    }
    
    if (destAsset.code === 'XLM') {
      destinationAsset = StellarSdk.Asset.native();
    } else {
      destinationAsset = new StellarSdk.Asset(destAsset.code, destAsset.issuer);
    }

    // Find paths for the exchange
    const paths = await server.strictSendPaths(
      sendingAsset,
      amount.toString(),
      [destinationAsset]
    ).call();

    if (paths.records.length > 0) {
      const bestPath = paths.records[0];
      const sourceAmount = parseFloat(bestPath.source_amount);
      const destAmount = parseFloat(bestPath.destination_amount);
      
      // Calculate the exchange rate
      const rate = destAmount / sourceAmount;
      
      return {
        rate,
        sourceAmount,
        destAmount,
        path: bestPath
      };
    } else {
      throw new Error('No path found for the exchange');
    }
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    throw error;
  }
};

// Soroban Contract Interaction

// Deploy a Soroban contract
const deploySorobanContract = async (adminSecret, wasmPath) => {
  try {
    const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecret);
    const adminPublicKey = adminKeypair.publicKey();

    // Load account details
    const account = await server.loadAccount(adminPublicKey);

    // Read WASM file
    const fs = require('fs');
    const wasm = fs.readFileSync(wasmPath);

    // Create the contract deployment transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_NETWORK === 'TESTNET'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC
    })
      .addOperation(StellarSdk.Operation.uploadContractWasm({
        wasm: wasm.toString('base64')
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(adminKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error deploying Soroban contract:', error);
    throw error;
  }
};

// Initialize a Soroban contract
const initializeSorobanContract = async (adminSecret, contractId, functionName, args) => {
  try {
    const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecret);
    const adminPublicKey = adminKeypair.publicKey();

    // Load account details
    const account = await server.loadAccount(adminPublicKey);

    // Create the contract initialization transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_NETWORK === 'TESTNET'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC
    })
      .addOperation(StellarSdk.Operation.invokeHostFunction({
        contractId,
        functionName,
        args
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(adminKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error initializing Soroban contract:', error);
    throw error;
  }
};

// Invoke a Soroban contract function
const invokeSorobanContract = async (userSecret, contractId, functionName, args) => {
  try {
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecret);
    const userPublicKey = userKeypair.publicKey();

    // Load account details
    const account = await server.loadAccount(userPublicKey);

    // Create the contract invocation transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_NETWORK === 'TESTNET'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC
    })
      .addOperation(StellarSdk.Operation.invokeHostFunction({
        contractId,
        functionName,
        args
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(userKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error invoking Soroban contract:', error);
    throw error;
  }
};

// Create a remittance using the Remittance contract
const createRemittance = async (userSecret, contractId, recipientPhone, recipientName, recipientCountry, amount, sourceToken, targetToken, exchangeRate, insurance, redemptionCode, notes) => {
  try {
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecret);
    const userPublicKey = userKeypair.publicKey();

    // Prepare arguments for the contract call
    const args = [
      StellarSdk.StrKey.encodeEd25519PublicKey(userPublicKey),
      recipientPhone,
      recipientName,
      recipientCountry,
      amount.toString(),
      sourceToken, // Contract address of the source token
      targetToken, // Contract address of the target token
      exchangeRate.toString(),
      insurance,
      redemptionCode,
      notes
    ];

    // Invoke the contract
    return await invokeSorobanContract(userSecret, contractId, 'create_remittance', args);
  } catch (error) {
    console.error('Error creating remittance:', error);
    throw error;
  }
};

// Redeem a remittance using the Remittance contract
const redeemRemittance = async (userSecret, contractId, remittanceId, redemptionCode) => {
  try {
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecret);
    const userPublicKey = userKeypair.publicKey();

    // Prepare arguments for the contract call
    const args = [
      remittanceId,
      redemptionCode,
      StellarSdk.StrKey.encodeEd25519PublicKey(userPublicKey)
    ];

    // Invoke the contract
    return await invokeSorobanContract(userSecret, contractId, 'redeem_remittance', args);
  } catch (error) {
    console.error('Error redeeming remittance:', error);
    throw error;
  }
};

// Create a family pool using the FamilyPool contract
const createFamilyPool = async (userSecret, contractId, name, token, withdrawalLimit, withdrawalPeriod) => {
  try {
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecret);
    const userPublicKey = userKeypair.publicKey();

    // Prepare arguments for the contract call
    const args = [
      StellarSdk.StrKey.encodeEd25519PublicKey(userPublicKey),
      name,
      token, // Contract address of the token
      withdrawalLimit.toString(),
      withdrawalPeriod // Daily, Weekly, or Monthly
    ];

    // Invoke the contract
    return await invokeSorobanContract(userSecret, contractId, 'create_pool', args);
  } catch (error) {
    console.error('Error creating family pool:', error);
    throw error;
  }
};

// Contribute to a family pool
const contributeToFamilyPool = async (userSecret, contractId, poolId, amount) => {
  try {
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecret);
    const userPublicKey = userKeypair.publicKey();

    // Prepare arguments for the contract call
    const args = [
      poolId,
      StellarSdk.StrKey.encodeEd25519PublicKey(userPublicKey),
      amount.toString()
    ];

    // Invoke the contract
    return await invokeSorobanContract(userSecret, contractId, 'contribute', args);
  } catch (error) {
    console.error('Error contributing to family pool:', error);
    throw error;
  }
};

// Get token info from the TokenWrapper contract
const getTokenInfo = async (contractId, tokenCode) => {
  try {
    // Use a server account for read-only operations
    const serverKeypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SERVER_SECRET);
    
    // Prepare arguments for the contract call
    const args = [tokenCode];

    // Invoke the contract
    return await invokeSorobanContract(
      process.env.STELLAR_SERVER_SECRET,
      contractId,
      'get_token_by_code',
      args
    );
  } catch (error) {
    console.error('Error getting token info:', error);
    throw error;
  }
};

// Calculate exchange rate between two tokens
const calculateTokenExchangeRate = async (contractId, fromToken, toToken, amount) => {
  try {
    // Use a server account for read-only operations
    const serverKeypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SERVER_SECRET);
    
    // Prepare arguments for the contract call
    const args = [fromToken, toToken, amount.toString()];

    // Invoke the contract
    return await invokeSorobanContract(
      process.env.STELLAR_SERVER_SECRET,
      contractId,
      'calculate_exchange_rate',
      args
    );
  } catch (error) {
    console.error('Error calculating token exchange rate:', error);
    throw error;
  }
};

module.exports = {
  server,
  createStellarAccount,
  createTrustline,
  sendPayment,
  getAccountBalances,
  createPathPayment,
  getExchangeRate,
  // Soroban contract functions
  deploySorobanContract,
  initializeSorobanContract,
  invokeSorobanContract,
  createRemittance,
  redeemRemittance,
  createFamilyPool,
  contributeToFamilyPool,
  getTokenInfo,
  calculateTokenExchangeRate
};
