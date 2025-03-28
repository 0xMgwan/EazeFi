import axios from 'axios';
import StellarSdk from 'stellar-sdk';

// Configure Stellar network (testnet or public)
const setupStellarNetwork = () => {
  if (process.env.REACT_APP_STELLAR_NETWORK === 'TESTNET') {
    StellarSdk.Networks.TESTNET;
    return new StellarSdk.Server('https://horizon-testnet.stellar.org');
  } else {
    StellarSdk.Networks.PUBLIC;
    return new StellarSdk.Server('https://horizon.stellar.org');
  }
};

const server = setupStellarNetwork();

// SEP-24 Deposit and Withdrawal functions
export const getDepositInfo = async (token) => {
  try {
    const response = await axios.get('/sep24/info', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting deposit info:', error);
    throw error;
  }
};

export const initiateDeposit = async (token, assetCode, amount, account) => {
  try {
    const response = await axios.post('/sep24/transactions/deposit/interactive', {
      asset_code: assetCode,
      amount,
      account
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating deposit:', error);
    throw error;
  }
};

export const initiateWithdrawal = async (token, assetCode, amount, account) => {
  try {
    const response = await axios.post('/sep24/transactions/withdraw/interactive', {
      asset_code: assetCode,
      amount,
      account
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating withdrawal:', error);
    throw error;
  }
};

export const getTransactions = async (token) => {
  try {
    const response = await axios.get('/sep24/transactions', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

export const getTransaction = async (token, id) => {
  try {
    const response = await axios.get(`/sep24/transaction?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.transaction;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};

// SEP-31 Cross-Border Payment functions
export const getCrossBorderInfo = async (token) => {
  try {
    const response = await axios.get('/sep31/info', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting cross-border info:', error);
    throw error;
  }
};

export const initiateCrossBorderPayment = async (token, params) => {
  try {
    const response = await axios.post('/sep31/transactions', params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating cross-border payment:', error);
    throw error;
  }
};

export const getCrossBorderTransaction = async (token, id) => {
  try {
    const response = await axios.get(`/sep31/transactions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.transaction;
  } catch (error) {
    console.error('Error getting cross-border transaction:', error);
    throw error;
  }
};

// SEP-8 Regulated Asset functions
export const getApproval = async (token, transaction) => {
  try {
    // Convert transaction to XDR
    const xdr = transaction.toXDR();
    
    // Send to approval server
    const response = await axios.post('/sep8/approval', {
      tx: xdr
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.status === 'success') {
      // Parse the signed transaction
      return new StellarSdk.Transaction(response.data.tx, StellarSdk.Networks.TESTNET);
    } else {
      throw new Error(response.data.error || 'Failed to get approval');
    }
  } catch (error) {
    console.error('Error getting approval:', error);
    throw error;
  }
};

// SEP-12 KYC functions
export const getCustomerInfo = async (token, id) => {
  try {
    const response = await axios.get(`/sep12/customer?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting customer info:', error);
    throw error;
  }
};

export const updateCustomerInfo = async (token, id, customerData) => {
  try {
    const response = await axios.put(`/sep12/customer?id=${id}`, customerData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating customer info:', error);
    throw error;
  }
};

export const getCustomerTypes = async () => {
  try {
    const response = await axios.get('/sep12/customer/types');
    return response.data.types;
  } catch (error) {
    console.error('Error getting customer types:', error);
    throw error;
  }
};

// Helper function to handle regulated asset payments
export const sendRegulatedPayment = async (token, sourceKeypair, destination, amount, asset) => {
  try {
    // Load source account
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    
    // Build the transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(StellarSdk.Operation.payment({
        destination,
        asset,
        amount: amount.toString()
      }))
      .setTimeout(30)
      .build();
    
    // Sign with the source account
    transaction.sign(sourceKeypair);
    
    // Get approval from the regulated asset approval server
    const approvedTransaction = await getApproval(token, transaction);
    
    // Submit the approved transaction
    const result = await server.submitTransaction(approvedTransaction);
    
    return result;
  } catch (error) {
    console.error('Error sending regulated payment:', error);
    throw error;
  }
};

export default {
  getDepositInfo,
  initiateDeposit,
  initiateWithdrawal,
  getTransactions,
  getTransaction,
  getCrossBorderInfo,
  initiateCrossBorderPayment,
  getCrossBorderTransaction,
  getApproval,
  getCustomerInfo,
  updateCustomerInfo,
  getCustomerTypes,
  sendRegulatedPayment
};
