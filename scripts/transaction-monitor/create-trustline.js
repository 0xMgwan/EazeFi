/**
 * EazeFi TSHT Trustline Creator
 * 
 * This script helps recipients establish a trustline for TSHT tokens,
 * which is required before they can receive TSHT remittances.
 */

const StellarSdk = require('stellar-sdk');
const readline = require('readline');

// Configuration
const config = {
  network: 'TESTNET',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  tshtIssuer: 'GB65WQQTEV7PWOVXUNW3S23AEXHYHZ2FFOIHH2OPCCAYN3VK45WLSZ2F',
  tshtCode: 'TSHT',
  tshtLimit: '1000000' // Default limit
};

// Initialize Stellar SDK
const server = new StellarSdk.Server(config.horizonUrl);
const networkPassphrase = config.network === 'TESTNET' 
  ? StellarSdk.Networks.TESTNET 
  : StellarSdk.Networks.PUBLIC;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt the user for input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} - The user's response
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Check if an account exists and has a TSHT trustline
 * @param {string} publicKey - The account's public key
 * @returns {Promise<boolean>} - Whether the account has a TSHT trustline
 */
async function checkTrustline(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    
    // Check if the account has a TSHT trustline
    const hasTrustline = account.balances.some(balance => 
      balance.asset_type !== 'native' &&
      balance.asset_code === config.tshtCode &&
      balance.asset_issuer === config.tshtIssuer
    );
    
    if (hasTrustline) {
      console.log('✅ Account already has a TSHT trustline.');
      return true;
    } else {
      console.log('❌ Account does not have a TSHT trustline.');
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('❌ Account does not exist on the Stellar network.');
    } else {
      console.error('Error checking account:', error.message);
    }
    return false;
  }
}

/**
 * Create a TSHT trustline for an account
 * @param {string} secretKey - The account's secret key
 * @param {string} limit - The trustline limit
 * @returns {Promise<boolean>} - Whether the trustline was created successfully
 */
async function createTrustline(secretKey, limit = config.tshtLimit) {
  try {
    // Create keypair from secret
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const publicKey = keypair.publicKey();
    
    console.log(`Creating TSHT trustline for account: ${publicKey}`);
    
    // Load the account
    const account = await server.loadAccount(publicKey);
    
    // Create the TSHT asset
    const tsht = new StellarSdk.Asset(config.tshtCode, config.tshtIssuer);
    
    // Build the transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: tsht,
        limit: limit
      }))
      .setTimeout(180)
      .build();
    
    // Sign the transaction
    transaction.sign(keypair);
    
    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    console.log('✅ TSHT trustline created successfully!');
    console.log(`Transaction hash: ${result.hash}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating trustline:', error.message);
    if (error.response && error.response.data && error.response.data.extras) {
      console.error('Transaction error details:', JSON.stringify(error.response.data.extras, null, 2));
    }
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== EazeFi TSHT Trustline Creator ===');
  console.log(`Network: ${config.network}`);
  console.log(`TSHT Issuer: ${config.tshtIssuer}`);
  console.log(`TSHT Code: ${config.tshtCode}`);
  console.log('');
  
  try {
    // Get the account's secret key
    const secretKey = await prompt('Enter your Stellar secret key (starts with S): ');
    
    if (!secretKey.startsWith('S')) {
      console.error('❌ Invalid secret key. Secret keys start with S.');
      return;
    }
    
    // Get the public key from the secret
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const publicKey = keypair.publicKey();
    
    console.log(`Account: ${publicKey}`);
    
    // Check if the account already has a trustline
    const hasTrustline = await checkTrustline(publicKey);
    
    if (!hasTrustline) {
      // Ask for confirmation
      const confirm = await prompt('Create TSHT trustline for this account? (y/n): ');
      
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        // Ask for the trustline limit
        const limitInput = await prompt(`Enter trustline limit (default: ${config.tshtLimit}): `);
        const limit = limitInput || config.tshtLimit;
        
        // Create the trustline
        await createTrustline(secretKey, limit);
      } else {
        console.log('Operation cancelled.');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
