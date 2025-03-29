const StellarSdk = require('@stellar/stellar-sdk');

// Configure Stellar SDK for the network
const server = new StellarSdk.Horizon.Server(process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');
const sorobanServer = new StellarSdk.SorobanRpc.Server(process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org');

/**
 * Call a Soroban contract method
 * @param {string} contractId - The contract ID
 * @param {string} method - The method to call
 * @param {Array} params - The parameters to pass to the method
 * @param {string} signerSecret - The secret key of the signer
 * @returns {Promise<any>} - The result of the contract call
 */
const callContractMethod = async (contractId, method, params, signerSecret) => {
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(signerSecret);
    const sourcePublicKey = sourceKeypair.publicKey();
    
    // Load account
    const account = await server.loadAccount(sourcePublicKey);
    
    // Create contract instance
    const contract = new StellarSdk.Contract(contractId);
    
    // Prepare transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_NETWORK === 'PUBLIC' 
        ? StellarSdk.Networks.PUBLIC 
        : StellarSdk.Networks.TESTNET
    })
      .addOperation(contract.call(method, ...params))
      .setTimeout(30)
      .build();
    
    // Sign transaction
    transaction.sign(sourceKeypair);
    
    // Submit transaction to Soroban RPC
    const response = await sorobanServer.sendTransaction(transaction);
    
    // Wait for transaction to be confirmed
    let result;
    if (response.status === 'PENDING') {
      let txResponse;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await sorobanServer.getTransaction(response.hash);
      } while (txResponse.status === 'PENDING');
      
      if (txResponse.status === 'SUCCESS') {
        result = txResponse.resultXdr;
      } else {
        throw new Error(`Transaction failed: ${txResponse.status}`);
      }
    } else {
      throw new Error(`Transaction submission failed: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error calling Soroban contract:', error);
    throw error;
  }
};

/**
 * Create a remittance using the Remittance contract
 * @param {string} contractId - The Remittance contract ID
 * @param {Object} params - The remittance parameters
 * @param {string} signerSecret - The secret key of the signer
 * @returns {Promise<string>} - The remittance ID
 */
const createRemittance = async (contractId, params, signerSecret) => {
  try {
    const {
      sender,
      recipientPhone,
      recipientName,
      recipientCountry,
      amount,
      sourceCurrency,
      targetCurrency,
      includeInsurance,
      redemptionCode,
      notes
    } = params;
    
    // Get the remittance contract ID from environment variables
    const remittanceContractId = process.env.REMITTANCE_CONTRACT_ID;
    if (!remittanceContractId) {
      throw new Error('Remittance contract ID not configured');
    }
    
    console.log(`Using Remittance contract: ${remittanceContractId}`);
    
    // Convert amount to the proper format for Soroban (7 decimal places)
    const tokenAmount = BigInt(Math.floor(parseFloat(amount) * 10000000));
    
    // Create parameters for creating a remittance
    const createRemittanceParams = [
      new StellarSdk.Address(sender).toScVal(),
      StellarSdk.xdr.ScVal.scvString(recipientPhone),
      StellarSdk.xdr.ScVal.scvI128(new StellarSdk.xdr.Int128Parts({
        hi: 0n,
        lo: tokenAmount
      }))
    ];
    
    // Call the Remittance contract to create a new remittance
    console.log('Calling Remittance contract create_remittance method...');
    const result = await callContractMethod(remittanceContractId, 'create_remittance', createRemittanceParams, signerSecret);
    
    // Parse the result to get the remittance ID
    let remittanceId;
    try {
      // The result should be a BytesN<32> value
      const resultXdr = StellarSdk.xdr.ScVal.fromXDR(result, 'base64');
      if (resultXdr.switch().name === 'scvBytes') {
        remittanceId = resultXdr.bytes().toString('hex');
      } else {
        // Fallback to generating a local ID if we can't parse the result
        remittanceId = generateRemittanceId(sender, recipientPhone, amount, Date.now());
        console.warn('Could not parse remittance ID from contract result, using locally generated ID');
      }
    } catch (err) {
      console.error('Error parsing remittance ID from contract result:', err);
      remittanceId = generateRemittanceId(sender, recipientPhone, amount, Date.now());
    }
    
    // Log the successful remittance creation
    console.log(`Remittance created with ID ${remittanceId} on contract ${remittanceContractId}`);
    console.log(`Sender: ${sender}`);
    console.log(`Recipient: ${recipientName} (${recipientPhone}) in ${recipientCountry}`);
    console.log(`Amount: ${amount} ${sourceCurrency} to be converted to ${targetCurrency}`);
    console.log(`Redemption code: ${redemptionCode}`);
    console.log(`Insurance: ${includeInsurance ? 'Yes' : 'No'}`);
    
    return remittanceId;
  } catch (error) {
    console.error('Error creating remittance:', error);
    throw error;
  }
};

/**
 * Generate a unique remittance ID
 * @param {string} sender - The sender's address
 * @param {string} recipient - The recipient's phone number
 * @param {string} amount - The amount being sent
 * @param {number} timestamp - The current timestamp
 * @returns {string} - A unique remittance ID
 */
const generateRemittanceId = (sender, recipient, amount, timestamp) => {
  const data = `${sender}-${recipient}-${amount}-${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
  return require('crypto').createHash('sha256').update(data).digest('hex');
};

/**
 * Get remittance details from the contract
 * @param {string} contractId - The remittance contract ID
 * @param {string} remittanceId - The remittance ID
 * @param {string} signerSecret - The secret key of the signer
 * @returns {Promise<Object>} - The remittance details
 */
/**
 * Get remittance details
 * Since we're using a token contract, we'll retrieve the remittance from our database
 * @param {string} contractId - The token contract ID (not used, but kept for API compatibility)
 * @param {string} remittanceId - The remittance ID
 * @param {string} signerSecret - The secret key of the signer (not used, but kept for API compatibility)
 * @returns {Promise<Object>} - The remittance details
 */
const getRemittance = async (contractId, remittanceId, signerSecret) => {
  try {
    // In a real implementation, you would retrieve the remittance from your database
    // For now, we'll just return a placeholder
    console.log(`Retrieving remittance with ID: ${remittanceId}`);
    
    // This would normally be retrieved from the database
    return {
      id: remittanceId,
      status: 'pending', // This should be retrieved from your database
      // Other remittance details would be here
    };
  } catch (error) {
    console.error('Error getting remittance:', error);
    throw error;
  }
};

/**
 * Redeem a remittance
 * @param {string} contractId - The remittance contract ID
 * @param {string} remittanceId - The remittance ID
 * @param {string} redeemMethod - The redeem method
 * @param {string} accountNumber - The account number for redemption
 * @param {string} signerSecret - The secret key of the signer
 * @returns {Promise<boolean>} - Whether the redemption was successful
 */
/**
 * Complete a remittance
 * Since we're using a token contract, we'll mark the remittance as completed in our database
 * @param {string} contractId - The token contract ID
 * @param {string} remittanceId - The remittance ID
 * @param {string} recipientAddress - The recipient's Stellar address
 * @param {string} redemptionCode - The redemption code
 * @param {string} signerSecret - The secret key of the platform wallet
 * @returns {Promise<boolean>} - Whether the completion was successful
 */
const completeRemittance = async (contractId, remittanceId, recipientAddress, redemptionCode, signerSecret) => {
  try {
    // In a real implementation, you would verify the redemption code and update the remittance in your database
    console.log(`Completing remittance with ID: ${remittanceId}`);
    console.log(`Recipient address: ${recipientAddress}`);
    console.log(`Redemption code: ${redemptionCode}`);
    
    // Get platform wallet address from environment variables
    const platformWalletAddress = process.env.PLATFORM_WALLET_PUBLIC_KEY;
    if (!platformWalletAddress) {
      throw new Error('Platform wallet address not configured');
    }
    
    // Get the remittance amount from your database (this is a placeholder)
    const amount = BigInt(1000000); // Example amount (0.1 with 7 decimal places)
    
    // Create parameters for token transfer from platform wallet to recipient
    const transferParams = [
      new StellarSdk.Address(platformWalletAddress).toScVal(),
      new StellarSdk.Address(recipientAddress).toScVal(),
      StellarSdk.xdr.ScVal.scvI128(new StellarSdk.xdr.Int128Parts({
        hi: 0n,
        lo: amount
      }))
    ];
    
    // Call token contract to transfer tokens
    const result = await callContractMethod(contractId, 'transfer', transferParams, signerSecret);
    
    // Mark the remittance as completed in your database
    // This would be implemented in your database logic
    
    return true;
  } catch (error) {
    console.error('Error completing remittance:', error);
    throw error;
  }
};

/**
 * Get token balance for an account
 * @param {string} contractId - The token contract ID
 * @param {string} accountAddress - The account address
 * @param {string} signerSecret - The secret key of the signer
 * @returns {Promise<string>} - The account balance
 */
const getTokenBalance = async (contractId, accountAddress, signerSecret) => {
  try {
    // Convert parameters to Soroban format
    const balanceParams = [
      new StellarSdk.Address(accountAddress).toScVal()
    ];
    
    // Call contract method
    const result = await callContractMethod(contractId, 'balance', balanceParams, signerSecret);
    
    // Parse result to get balance
    const balance = StellarSdk.scValToNative(result);
    
    // Convert from token decimal representation (7 decimal places) to string
    return (Number(balance) / 10000000).toString();
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
};

module.exports = {
  callContractMethod,
  createRemittance,
  getRemittance,
  completeRemittance,
  getTokenBalance,
  generateRemittanceId
};
