/**
 * EazeFi TSHT Trustline Authorizer
 * 
 * This script authorizes a trustline for a recipient account.
 */

const StellarSdk = require('stellar-sdk');

// Configuration
const config = {
  network: 'TESTNET',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  
  // TSHT issuer account details
  issuerPublicKey: 'GB65WQQTEV7PWOVXUNW3S23AEXHYHZ2FFOIHH2OPCCAYN3VK45WLSZ2F',
  issuerSecretKey: process.env.ISSUER_SECRET || 'SCSFPLN3FM4EYZXQUE47OEE5TCKN7XVRAFKXR45ESEF2OGD5XX5LWXAE',
  
  // TSHT token details
  tshtCode: 'TSHT',
  
  // Recipient account
  recipientPublicKey: 'GAQWCPCS4W2YW4YA2VAKDKDXSZZ7W5NRKTTFG5GHISMYYJNK6OMHUKMO'
};

// Initialize Stellar SDK
const server = new StellarSdk.Server(config.horizonUrl);
const networkPassphrase = config.network === 'TESTNET' 
  ? StellarSdk.Networks.TESTNET 
  : StellarSdk.Networks.PUBLIC;

// Create keypair from secret
const issuerKeypair = StellarSdk.Keypair.fromSecret(config.issuerSecretKey);

/**
 * Authorize a trustline for a recipient account
 */
async function authorizeTrustline() {
  try {
    console.log(`Authorizing TSHT trustline for account: ${config.recipientPublicKey}`);
    
    // Load the issuer account
    const issuerAccount = await server.loadAccount(config.issuerPublicKey);
    console.log('Issuer account loaded successfully');
    
    // Create the TSHT asset
    const tsht = new StellarSdk.Asset(config.tshtCode, config.issuerPublicKey);
    
    // Build the transaction to authorize the trustline
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase
    })
      .addOperation(StellarSdk.Operation.allowTrust({
        trustor: config.recipientPublicKey,
        assetCode: config.tshtCode,
        authorize: true
      }))
      .setTimeout(180)
      .build();
    
    // Sign the transaction
    transaction.sign(issuerKeypair);
    
    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    console.log('✅ Trustline authorized successfully!');
    console.log(`Transaction hash: ${result.hash}`);
    
    // Check the recipient's balances to verify authorization
    const recipientAccount = await server.loadAccount(config.recipientPublicKey);
    const tshtBalance = recipientAccount.balances.find(balance => 
      balance.asset_type !== 'native' &&
      balance.asset_code === config.tshtCode &&
      balance.asset_issuer === config.issuerPublicKey
    );
    
    if (tshtBalance) {
      console.log('Recipient TSHT balance:', tshtBalance);
      console.log('Authorization status:', tshtBalance.is_authorized ? 'Authorized' : 'Not authorized');
    } else {
      console.log('No TSHT balance found for recipient');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error authorizing trustline:', error.message);
    if (error.response && error.response.data && error.response.data.extras) {
      console.error('Transaction error details:', JSON.stringify(error.response.data.extras, null, 2));
    }
    return false;
  }
}

// Run the authorization
authorizeTrustline();
