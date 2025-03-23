/**
 * M-Pesa Tanzania Integration Utility
 * This module handles integration with M-Pesa Tanzania for crypto to mobile money transfers
 */
const axios = require('axios');
const crypto = require('crypto');

// M-Pesa Tanzania API configuration
const MPESA_TZ_API_URL = process.env.MPESA_TZ_API_URL || 'https://openapi.m-pesa.com/sandbox/ipg/v2/vodacomTZN';
const MPESA_TZ_API_KEY = process.env.MPESA_TZ_API_KEY;
const MPESA_TZ_PUBLIC_KEY = process.env.MPESA_TZ_PUBLIC_KEY;
const MPESA_TZ_SERVICE_PROVIDER_CODE = process.env.MPESA_TZ_SERVICE_PROVIDER_CODE;

/**
 * Generate a unique transaction ID
 * @returns {string} - Unique transaction ID
 */
const generateTransactionId = () => {
  return `TZ${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

/**
 * Encrypt the API request using M-Pesa public key
 * @param {Object} payload - The payload to encrypt
 * @returns {string} - Encrypted payload
 */
const encryptRequest = (payload) => {
  const publicKey = Buffer.from(MPESA_TZ_PUBLIC_KEY, 'base64').toString('ascii');
  const buffer = Buffer.from(JSON.stringify(payload));
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    buffer
  );
  return encrypted.toString('base64');
};

/**
 * Initiate a C2B (Customer to Business) transaction
 * This is used when sending money to an M-Pesa account
 * 
 * @param {string} phoneNumber - Recipient's phone number (format: 255XXXXXXXXX)
 * @param {number} amount - Amount to send in TZS
 * @param {string} reference - Payment reference
 * @param {string} description - Payment description
 * @returns {Promise<Object>} - Transaction result
 */
const initiateC2B = async (phoneNumber, amount, reference, description) => {
  try {
    // Validate phone number format (Tanzania format: 255XXXXXXXXX)
    if (!phoneNumber.match(/^255[0-9]{9}$/)) {
      throw new Error('Invalid phone number format. Must be 255XXXXXXXXX');
    }

    // Prepare the request payload
    const transactionId = generateTransactionId();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    
    const payload = {
      input_Amount: amount.toString(),
      input_Country: 'TZN',
      input_Currency: 'TZS',
      input_CustomerMSISDN: phoneNumber,
      input_ServiceProviderCode: MPESA_TZ_SERVICE_PROVIDER_CODE,
      input_ThirdPartyConversationID: transactionId,
      input_TransactionReference: reference,
      input_PurchasedItemsDesc: description
    };

    // Encrypt the payload
    const encryptedPayload = encryptRequest(payload);

    // Make the API request
    const response = await axios.post(
      `${MPESA_TZ_API_URL}/c2bPayment/singleStage/`,
      {
        input_data: encryptedPayload
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': '*',
          'Authorization': `Bearer ${MPESA_TZ_API_KEY}`
        }
      }
    );

    return {
      success: true,
      transactionId,
      reference,
      response: response.data
    };
  } catch (error) {
    console.error('M-Pesa C2B transaction error:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || {}
    };
  }
};

/**
 * Check the status of a transaction
 * 
 * @param {string} transactionId - The transaction ID to check
 * @returns {Promise<Object>} - Transaction status
 */
const checkTransactionStatus = async (transactionId) => {
  try {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    
    const payload = {
      input_QueryReference: transactionId,
      input_ServiceProviderCode: MPESA_TZ_SERVICE_PROVIDER_CODE,
      input_ThirdPartyConversationID: `status-${Date.now()}`,
    };

    // Encrypt the payload
    const encryptedPayload = encryptRequest(payload);

    // Make the API request
    const response = await axios.post(
      `${MPESA_TZ_API_URL}/queryTransactionStatus/`,
      {
        input_data: encryptedPayload
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': '*',
          'Authorization': `Bearer ${MPESA_TZ_API_KEY}`
        }
      }
    );

    return {
      success: true,
      transactionId,
      status: response.data
    };
  } catch (error) {
    console.error('M-Pesa transaction status check error:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || {}
    };
  }
};

/**
 * Convert crypto amount to TZS based on current exchange rate
 * 
 * @param {string} cryptoAsset - The crypto asset code (e.g., 'XLM', 'USDC')
 * @param {number} cryptoAmount - Amount in crypto
 * @returns {Promise<number>} - Equivalent amount in TZS
 */
const convertCryptoToTZS = async (cryptoAsset, cryptoAmount) => {
  try {
    // Get current exchange rates from a reliable API
    // For production, you should use a real exchange rate API
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const rates = response.data.rates;
    
    // Convert crypto to USD first
    let usdAmount;
    
    if (cryptoAsset === 'USDC') {
      // USDC is pegged to USD
      usdAmount = cryptoAmount;
    } else if (cryptoAsset === 'XLM') {
      // For XLM, get current price from CoinGecko or similar API
      const xlmResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd');
      const xlmPrice = xlmResponse.data.stellar.usd;
      usdAmount = cryptoAmount * xlmPrice;
    } else {
      throw new Error(`Unsupported crypto asset: ${cryptoAsset}`);
    }
    
    // Convert USD to TZS
    const tzsRate = rates.TZS;
    const tzsAmount = usdAmount * tzsRate;
    
    // Round to nearest whole number (TZS doesn't have decimals)
    return Math.round(tzsAmount);
  } catch (error) {
    console.error('Error converting crypto to TZS:', error);
    throw error;
  }
};

module.exports = {
  initiateC2B,
  checkTransactionStatus,
  convertCryptoToTZS
};
