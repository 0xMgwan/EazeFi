/**
 * EazeFi Transaction Monitor
 * 
 * This script monitors the Stellar network for transactions with the "EazeFi:" memo prefix
 * and issues TSHT tokens to the recipients based on the XLM amount and exchange rate.
 */

const StellarSdk = require('stellar-sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Network configuration
  network: 'TESTNET', // or 'PUBLIC' for mainnet
  horizonUrl: 'https://horizon-testnet.stellar.org',
  
  // TSHT token configuration
  tshtIssuer: 'GB65WQQTEV7PWOVXUNW3S23AEXHYHZ2FFOIHH2OPCCAYN3VK45WLSZ2F',
  tshtCode: 'TSHT',
  
  // Exchange rate: 1 XLM = ? TSHT
  exchangeRate: 248.73,
  
  // Soroban remittance contract
  remittanceContractId: 'CDRZTAFZ5U2CJ3ICR23U2RT46I5FVPKEG3ZSA233RHISFH4QKUK2RL3A',
  
  // Issuer account (needs to be funded and have the secret key)
  issuerSecret: process.env.ISSUER_SECRET || '', // Set this via environment variable for security
  
  // Monitoring configuration
  monitoringAccount: '', // Will be set from the issuer keypair
  memoPrefix: 'EazeFi:',
  
  // Transaction history tracking
  historyFile: path.join(__dirname, 'transaction-history.json'),
  
  // Logging
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
};

// Initialize the Stellar SDK
const server = new StellarSdk.Server(config.horizonUrl);
const networkPassphrase = config.network === 'TESTNET' 
  ? StellarSdk.Networks.TESTNET 
  : StellarSdk.Networks.PUBLIC;

// Create a keypair from the issuer secret
let issuerKeypair;
if (config.issuerSecret) {
  try {
    issuerKeypair = StellarSdk.Keypair.fromSecret(config.issuerSecret);
    config.monitoringAccount = issuerKeypair.publicKey();
    console.log(`Using issuer account: ${config.monitoringAccount}`);
  } catch (error) {
    console.error('Invalid issuer secret key:', error.message);
    process.exit(1);
  }
} else {
  console.warn('No issuer secret key provided. Will run in monitoring-only mode.');
  // You'll need to set a monitoring account to watch for transactions
  if (!config.monitoringAccount) {
    console.error('No monitoring account specified. Please set either issuerSecret or monitoringAccount.');
    process.exit(1);
  }
}

// Transaction history tracking
let transactionHistory = [];
try {
  if (fs.existsSync(config.historyFile)) {
    transactionHistory = JSON.parse(fs.readFileSync(config.historyFile, 'utf8'));
    console.log(`Loaded ${transactionHistory.length} historical transactions.`);
  }
} catch (error) {
  console.warn('Could not load transaction history:', error.message);
}

// Save transaction history
function saveTransactionHistory() {
  try {
    fs.writeFileSync(config.historyFile, JSON.stringify(transactionHistory, null, 2));
    console.log(`Saved ${transactionHistory.length} transactions to history.`);
  } catch (error) {
    console.error('Error saving transaction history:', error.message);
  }
}

// Check if a transaction has already been processed
function isTransactionProcessed(txHash) {
  return transactionHistory.some(tx => tx.hash === txHash);
}

// Add a transaction to the history
function addTransactionToHistory(transaction, status = 'processed') {
  transactionHistory.push({
    hash: transaction.hash,
    timestamp: new Date().toISOString(),
    from: transaction.source_account,
    to: transaction.to || '',
    amount: transaction.amount || '',
    memo: transaction.memo || '',
    status: status
  });
  
  // Keep history at a reasonable size
  if (transactionHistory.length > 1000) {
    transactionHistory = transactionHistory.slice(-1000);
  }
  
  saveTransactionHistory();
}

/**
 * Issue TSHT tokens to a recipient
 * @param {string} recipient - The recipient's Stellar address
 * @param {string} amount - The amount of TSHT to issue
 * @param {string} txHash - The original transaction hash
 */
async function issueTSHT(recipient, amount, txHash) {
  if (!issuerKeypair) {
    console.warn(`Cannot issue TSHT to ${recipient}: No issuer secret key provided.`);
    return false;
  }
  
  try {
    console.log(`Issuing ${amount} TSHT to ${recipient}`);
    
    // Load the issuer account
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    
    // Create the TSHT asset
    const tsht = new StellarSdk.Asset(config.tshtCode, config.tshtIssuer);
    
    // Build the transaction
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: recipient,
        asset: tsht,
        amount: amount.toString()
      }))
      .addMemo(StellarSdk.Memo.text(`TSHT Remittance for ${txHash.substring(0, 8)}`))
      .setTimeout(180)
      .build();
    
    // Sign the transaction
    transaction.sign(issuerKeypair);
    
    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    console.log(`TSHT issued successfully. Transaction hash: ${result.hash}`);
    return true;
  } catch (error) {
    console.error('Error issuing TSHT:', error.message);
    if (error.response && error.response.data && error.response.data.extras) {
      console.error('Transaction error details:', JSON.stringify(error.response.data.extras, null, 2));
    }
    return false;
  }
}

/**
 * Process a payment operation
 * @param {Object} payment - The payment operation
 */
async function processPayment(payment) {
  try {
    // Get the full transaction to check the memo
    const transaction = await server.transactions().transaction(payment.transaction_hash).call();
    
    // Skip if already processed
    if (isTransactionProcessed(transaction.hash)) {
      console.log(`Transaction ${transaction.hash} already processed. Skipping.`);
      return;
    }
    
    // Check if this is an EazeFi remittance transaction
    if (transaction.memo_type === 'text' && 
        transaction.memo && 
        transaction.memo.startsWith(config.memoPrefix)) {
      
      console.log(`Found EazeFi remittance transaction: ${transaction.hash}`);
      console.log(`From: ${payment.from}, To: ${payment.to}, Amount: ${payment.amount} ${payment.asset_type === 'native' ? 'XLM' : payment.asset_code}`);
      
      // Only process XLM payments
      if (payment.asset_type === 'native') {
        // Calculate TSHT amount based on exchange rate
        const xlmAmount = parseFloat(payment.amount);
        const tshtAmount = (xlmAmount * config.exchangeRate).toFixed(7);
        
        console.log(`Converting ${xlmAmount} XLM to ${tshtAmount} TSHT at rate ${config.exchangeRate}`);
        
        // Issue TSHT to the recipient
        const success = await issueTSHT(payment.to, tshtAmount, transaction.hash);
        
        // Record the transaction
        addTransactionToHistory({
          hash: transaction.hash,
          source_account: payment.from,
          to: payment.to,
          amount: payment.amount,
          memo: transaction.memo
        }, success ? 'completed' : 'failed');
        
        console.log(`Remittance processing ${success ? 'completed' : 'failed'} for transaction ${transaction.hash}`);
      } else {
        console.log(`Skipping non-XLM payment: ${payment.asset_code || payment.asset_type}`);
      }
    }
  } catch (error) {
    console.error(`Error processing payment:`, error.message);
  }
}

/**
 * Start monitoring for payments
 */
function startMonitoring() {
  console.log(`Starting to monitor account ${config.monitoringAccount} for EazeFi remittance transactions...`);
  
  // Stream payments to the monitoring account
  const paymentsStream = server.payments()
    .forAccount(config.monitoringAccount)
    .cursor('now')
    .stream({
      onmessage: payment => {
        // Only process payments, not other operations
        if (payment.type === 'payment') {
          processPayment(payment);
        }
      },
      onerror: error => {
        console.error('Error in payment stream:', error.message);
        // Restart the stream after a delay
        setTimeout(startMonitoring, 5000);
      }
    });
  
  // Also monitor for all transactions with our memo prefix
  // This is a fallback to catch transactions that might not directly involve our monitoring account
  const txStream = server.transactions()
    .cursor('now')
    .stream({
      onmessage: async transaction => {
        if (transaction.memo_type === 'text' && 
            transaction.memo && 
            transaction.memo.startsWith(config.memoPrefix)) {
          
          // Skip if already processed
          if (isTransactionProcessed(transaction.hash)) {
            return;
          }
          
          console.log(`Found EazeFi memo in transaction: ${transaction.hash}`);
          
          // Get the operations for this transaction
          const operations = await server.operations()
            .forTransaction(transaction.hash)
            .call();
          
          // Process payment operations
          for (const record of operations.records) {
            if (record.type === 'payment' && record.asset_type === 'native') {
              await processPayment(record);
            }
          }
        }
      },
      onerror: error => {
        console.error('Error in transaction stream:', error.message);
        // Continue monitoring
      }
    });
  
  console.log('Monitoring active. Press Ctrl+C to stop.');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (paymentsStream) paymentsStream.close();
    if (txStream) txStream.close();
    saveTransactionHistory();
    process.exit(0);
  });
}

// Start the monitoring process
startMonitoring();

// Also check recent transactions to catch any that happened while the monitor was offline
async function checkRecentTransactions() {
  console.log('Checking recent transactions...');
  
  try {
    // Get recent transactions (last 50)
    const transactions = await server.transactions()
      .forAccount(config.monitoringAccount)
      .limit(50)
      .order('desc')
      .call();
    
    console.log(`Found ${transactions.records.length} recent transactions.`);
    
    // Process each transaction
    for (const tx of transactions.records) {
      // Skip if already processed
      if (isTransactionProcessed(tx.hash)) {
        continue;
      }
      
      if (tx.memo_type === 'text' && tx.memo && tx.memo.startsWith(config.memoPrefix)) {
        console.log(`Processing recent transaction: ${tx.hash}`);
        
        // Get the operations for this transaction
        const operations = await server.operations()
          .forTransaction(tx.hash)
          .call();
        
        // Process payment operations
        for (const record of operations.records) {
          if (record.type === 'payment' && record.asset_type === 'native') {
            await processPayment(record);
          }
        }
      }
    }
    
    console.log('Recent transaction check completed.');
  } catch (error) {
    console.error('Error checking recent transactions:', error.message);
  }
}

// Check recent transactions on startup
checkRecentTransactions();
