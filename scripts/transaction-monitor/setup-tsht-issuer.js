/**
 * EazeFi TSHT Issuer Setup
 * 
 * This script sets up an account as a TSHT token issuer for the hackathon.
 */

const StellarSdk = require('stellar-sdk');

// Configuration
const config = {
  network: 'TESTNET',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  
  // New TSHT issuer account details
  issuerPublicKey: 'GB65WQQTEV7PWOVXUNW3S23AEXHYHZ2FFOIHH2OPCCAYN3VK45WLSZ2F',
  issuerSecretKey: 'SCSFPLN3FM4EYZXQUE47OEE5TCKN7XVRAFKXR45ESEF2OGD5XX5LWXAE',
  
  // TSHT token details
  tshtCode: 'TSHT',
  
  // Original TSHT issuer for reference
  originalTshtIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
};

// Initialize Stellar SDK
const server = new StellarSdk.Server(config.horizonUrl);
const networkPassphrase = config.network === 'TESTNET' 
  ? StellarSdk.Networks.TESTNET 
  : StellarSdk.Networks.PUBLIC;

// Create keypair from secret
const issuerKeypair = StellarSdk.Keypair.fromSecret(config.issuerSecretKey);

/**
 * Set up the TSHT issuer account
 */
async function setupTshtIssuer() {
  try {
    console.log(`Setting up TSHT issuer account: ${config.issuerPublicKey}`);
    
    // Load the issuer account
    const issuerAccount = await server.loadAccount(config.issuerPublicKey);
    console.log('Account loaded successfully');
    
    // Set up the account as a TSHT issuer
    // This involves setting account flags to control authorization
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase
    })
      .addOperation(StellarSdk.Operation.setOptions({
        // Set flags for the issuer account
        // AUTH_REQUIRED_FLAG: Requires the issuer to approve trustlines
        // AUTH_REVOCABLE_FLAG: Allows the issuer to revoke trustlines
        // AUTH_CLAWBACK_ENABLED_FLAG: Allows the issuer to claw back assets
        setFlags: 
          StellarSdk.AuthRequiredFlag | 
          StellarSdk.AuthRevocableFlag
      }))
      .addOperation(StellarSdk.Operation.manageData({
        name: 'TSHT_issuer',
        value: 'EazeFi Hackathon TSHT Issuer'
      }))
      .setTimeout(180)
      .build();
    
    // Sign the transaction
    transaction.sign(issuerKeypair);
    
    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    console.log('✅ TSHT issuer account set up successfully!');
    console.log(`Transaction hash: ${result.hash}`);
    
    console.log('\n=== TSHT Issuer Setup Complete ===');
    console.log(`Public Key: ${config.issuerPublicKey}`);
    console.log(`Asset Code: ${config.tshtCode}`);
    console.log('\nTo use this issuer with the transaction monitor:');
    console.log(`1. Export the secret key: export ISSUER_SECRET=${config.issuerSecretKey}`);
    console.log('2. Update the tshtIssuer value in monitor.js to:');
    console.log(`   tshtIssuer: '${config.issuerPublicKey}'`);
    console.log('\nFor testing, create a trustline to this issuer using:');
    console.log('node create-trustline.js');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up TSHT issuer:', error.message);
    if (error.response && error.response.data && error.response.data.extras) {
      console.error('Transaction error details:', JSON.stringify(error.response.data.extras, null, 2));
    }
    return false;
  }
}

// Run the setup
setupTshtIssuer();
