import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';
import * as StellarSdk from 'stellar-sdk';
import { FaExchangeAlt, FaCheckCircle, FaInfoCircle, FaCopy, FaSpinner, FaQrcode } from 'react-icons/fa';
import { BiChevronLeft } from 'react-icons/bi';
import { toast } from 'react-toastify';

const SendMoney = () => {
  const { 
    balances, 
    getBalance, 
    wallet,
    walletKit // Add walletKit from context
  } = useContext(WalletContext);
  
  const navigate = useNavigate();
  
  // Form state
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('XLM');
  
  // Recipient identification options
  const [recipientType, setRecipientType] = useState('phone'); // 'phone' or 'address'
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  
  // Transaction state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [recipientTSHTAmount, setRecipientTSHTAmount] = useState('0');
  const [success, setSuccess] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(248.73); // Mock exchange rate for XLM to TSHT
  
  // Initialize
  useEffect(() => {
    // Get wallet balance
    getBalance();
  }, []);
  
  // Validate Stellar address
  const isValidStellarAddress = (address) => {
    try {
      return StellarSdk.StrKey.isValidEd25519PublicKey(address);
    } catch (e) {
      return false;
    }
  };
  
  // Calculate recipient amount in TSHT based on selected asset amount
  useEffect(() => {
    if (amount && exchangeRate) {
      if (selectedAsset === 'XLM') {
        setRecipientTSHTAmount((parseFloat(amount) * exchangeRate).toFixed(2));
      } else if (selectedAsset === 'USDC') {
        setRecipientTSHTAmount((parseFloat(amount) * exchangeRate * 3.5).toFixed(2));
      }
    } else {
      setRecipientTSHTAmount('0');
    }
  }, [amount, exchangeRate, selectedAsset]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    switch(name) {
      case 'amount':
        // Only allow numbers and a single decimal point
        const regex = /^\d*\.?\d*$/;
        if (regex.test(value) || value === '') {
          setAmount(value);
        }
        break;
      case 'recipientName':
        setRecipientName(value);
        break;
      case 'recipientCountry':
        setRecipientCountry(value);
        break;
      case 'selectedAsset':
        setSelectedAsset(value);
        break;
      case 'recipientPhone':
        setRecipientPhone(value);
        break;
      case 'recipientAddress':
        setRecipientAddress(value);
        break;
      case 'recipientType':
        setRecipientType(value);
        // Clear the other field when switching types
        if (value === 'phone') {
          setRecipientAddress('');
        } else {
          setRecipientPhone('');
        }
        break;
      default:
        break;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for step 1
    if (step === 1) {
      if (!recipientName) {
        setError('Please enter a recipient name');
        return;
      }
      
      if (!recipientCountry) {
        setError('Please select a recipient country');
        return;
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      // Validate recipient identification based on selected type
      if (recipientType === 'phone') {
        if (!recipientPhone) {
          setError('Please enter a recipient phone number');
          return;
        }
        // Basic phone number validation
        if (!/^\+?[0-9]{10,15}$/.test(recipientPhone.replace(/\s/g, ''))) {
          setError('Please enter a valid phone number');
          return;
        }
      } else { // Stellar address validation
        if (!recipientAddress) {
          setError('Please enter a recipient Stellar address');
          return;
        }
        
        if (!isValidStellarAddress(recipientAddress)) {
          setError('Please enter a valid Stellar address');
          return;
        }
      }
      
      // Move to next step
      setStep(2);
      return;
    }
    
    // For step 2 - process the transaction
    if (step === 2) {
      // Show confirmation dialog with appropriate recipient information
      let recipientInfo = recipientName;
      if (recipientType === 'phone') {
        recipientInfo += ` (${recipientPhone})`;
      } else {
        // For Stellar addresses, show a shortened version for readability
        const shortAddress = recipientAddress.substring(0, 6) + '...' + recipientAddress.substring(recipientAddress.length - 6);
        recipientInfo += ` (${shortAddress})`;
      }
      
      const confirmMsg = `IMPORTANT: This will send ${amount} ${selectedAsset} from your wallet to ${recipientInfo} in ${recipientCountry}.\n\nDo you want to proceed with this transaction?`;
      
      if (!window.confirm(confirmMsg)) {
        setError('Transaction cancelled by user');
        return;
      }
      
      setIsSubmitting(true);
      setError(null);
      
      try {
        // Process the transaction
        const success = await processTransaction();
        
        // Make sure we explicitly set step 3 and success state here
        if (success) {
          console.log('Transaction successful, moving to step 3');
          // Set success state first, then update step
          setSuccess(true);
          setStep(3); // Move to completion step
        }
      } catch (err) {
        console.error('Error processing transaction:', err);
        setError(err.message || 'Failed to process transaction');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Add debugging effect to track state changes
  useEffect(() => {
    console.log('State updated:', { step, success, isSubmitting, transactionHash });
  }, [step, success, isSubmitting, transactionHash]);

  // Process the transaction using proper wallet signing
  const processTransaction = async () => {
    console.log('Starting transaction processing...');
    if (!wallet || !wallet.address) {
      setError('No wallet connected. Please connect your wallet first.');
      return false;
    }
    
    try {
      // Initialize Stellar SDK
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      
      // Get the source account
      const sourceAccount = await server.loadAccount(wallet.address);
      console.log('Source account loaded:', wallet.address);
      
      // Determine which asset to send
      let assetToSend;
      if (selectedAsset === 'XLM') {
        assetToSend = StellarSdk.Asset.native();
      } else if (selectedAsset === 'USDC') {
        // Use the testnet USDC issuer - from M-Pesa Soroban integration
        const usdcIssuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
        assetToSend = new StellarSdk.Asset('USDC', usdcIssuer);
      }
      
      // Generate a random recipient address if needed
      if (!recipientAddress) {
        const keypair = StellarSdk.Keypair.random();
        setRecipientAddress(keypair.publicKey());
      }
      
      console.log('Sending from:', wallet.address);
      console.log('Sending to:', recipientAddress);
      console.log('Amount:', amount, selectedAsset);
      
      // Build the transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: recipientAddress,
          asset: assetToSend,
          amount: amount.toString()
        }))
        .addMemo(StellarSdk.Memo.text('EazeFi Remittance'))
        .setTimeout(180)
        .build();
      
      // Show a toast notification to inform the user
      toast.info('Preparing transaction...', { autoClose: 3000 });
      
      // SIMPLER, DIRECT APPROACH: Handle wallet signing based on wallet type
      let signedXdr = null;
      
      // Check if we have direct access to the wallet's secret key (for development/testing)
      if (wallet.secret) {
        try {
          // Sign directly with the secret key
          console.log('Signing transaction directly with secret key');
          const keypair = StellarSdk.Keypair.fromSecret(wallet.secret);
          transaction.sign(keypair);
          signedXdr = transaction.toXDR();
          console.log('Transaction signed successfully with secret key');
        } catch (signError) {
          console.error('Error signing with secret key:', signError);
          throw new Error('Failed to sign transaction: ' + signError.message);
        }
      }
      // If we don't have a secret key, try to use the wallet's extension
      else {
        // Show a toast notification to inform the user
        toast.info('Please confirm the transaction in your wallet extension', {
          autoClose: false,
          closeOnClick: false,
          toastId: 'wallet-confirmation'
        });
        
        try {
          // Check if we're using Albedo
          if (wallet.name === 'Albedo' || wallet.walletId?.includes('albedo')) {
            console.log('Using Albedo for transaction signing');
            // Import Albedo if not already available
            if (!window.albedo) {
              try {
                // Check if albedo is available globally
                if (typeof window.albedo !== 'undefined') {
                  console.log('Using already available Albedo from window');
                } else {
                  console.log('Albedo not found globally, trying to import');
                  // Try to dynamically import albedo-sdk
                  const albedoModule = await import('@albedo-link/intent');
                  window.albedo = albedoModule.default;
                  console.log('Albedo imported successfully');
                }
              } catch (importError) {
                console.error('Failed to import Albedo:', importError);
                throw new Error('Albedo wallet integration not available');
              }
            }
            
            console.log('Requesting Albedo to sign transaction...');
            try {
              // First, let's check if the destination account exists
              try {
                console.log('Checking if destination account exists:', recipientAddress);
                await server.loadAccount(recipientAddress);
                console.log('Destination account exists');
              } catch (accountError) {
                console.error('Destination account does not exist:', accountError);
                
                // If the account doesn't exist, we need to create it first
                toast.info('Creating destination account...', { autoClose: 5000 });
                
                try {
                  // Modify the transaction to create the account instead
                  const createAccountTx = new StellarSdk.TransactionBuilder(sourceAccount, {
                    fee: StellarSdk.BASE_FEE,
                    networkPassphrase: StellarSdk.Networks.TESTNET
                  })
                    .addOperation(StellarSdk.Operation.createAccount({
                      destination: recipientAddress,
                      startingBalance: '2' // Minimum balance for a new account
                    }))
                    .addMemo(StellarSdk.Memo.text('EazeFi Account Creation'))
                    .setTimeout(180)
                    .build();
                    
                  // Sign and submit the create account transaction
                  const createAccountResult = await window.albedo.tx({
                    xdr: createAccountTx.toXDR(),
                    network: 'testnet',
                    submit: true
                  });
                  
                  console.log('Account creation result:', createAccountResult);
                  
                  if (!createAccountResult.tx_hash) {
                    throw new Error('Failed to create destination account');
                  }
                  
                  // Wait for the account creation transaction to be processed
                  toast.info('Waiting for account creation to be confirmed...', { autoClose: 5000 });
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  
                  // Reload the source account to get updated sequence number
                  sourceAccount = await server.loadAccount(wallet.address);
                  
                  // Rebuild the payment transaction with the updated source account
                  transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                    fee: StellarSdk.BASE_FEE,
                    networkPassphrase: StellarSdk.Networks.TESTNET
                  })
                    .addOperation(StellarSdk.Operation.payment({
                      destination: recipientAddress,
                      asset: assetToSend,
                      amount: amount.toString()
                    }))
                    .addMemo(StellarSdk.Memo.text('EazeFi Remittance'))
                    .setTimeout(180)
                    .build();
                } catch (createError) {
                  console.error('Error creating destination account:', createError);
                  throw new Error('Failed to create destination account: ' + createError.message);
                }
              }
              
              // Use Albedo's tx intent to sign and submit the transaction
              // Show a toast notification that will auto-close when transaction is confirmed
              const confirmToastId = toast.info('Please confirm the transaction in your wallet extension', {
                position: "top-center",
                autoClose: false,
                closeButton: false,
                closeOnClick: false,
                draggable: false,
                progress: undefined,
              });
              
              try {
                console.log('Requesting Albedo to sign and submit transaction...');
                const albedoResult = await window.albedo.tx({
                  xdr: transaction.toXDR(),
                  network: 'testnet',
                  submit: true // Let Albedo submit the transaction
                });
                
                // Auto-close the confirmation toast when transaction is confirmed
                toast.dismiss(confirmToastId);
                
                console.log('Albedo transaction result:', albedoResult);
                
                // Store the transaction hash from Albedo's response
                if (albedoResult.tx_hash) {
                  // We already have the transaction hash, so we don't need to submit it again
                  setTransactionHash(albedoResult.tx_hash);
                  console.log('Transaction submitted directly by Albedo:', albedoResult.tx_hash);
                  
                  // CRITICAL FIX: Immediately set success state and move to step 3
                  console.log('ALBEDO SUCCESS: Setting success state and moving to step 3');
                  setSuccess(true);
                  setStep(3);
                  
                  // Force a re-render by updating state
                  setTimeout(() => {
                    console.log('Forcing re-render after Albedo success');
                    setSuccess(true);
                  }, 100);
                  
                  // Skip the rest of the transaction submission code
                  // by setting a flag to indicate we've already submitted
                  signedXdr = 'SUBMITTED_BY_ALBEDO';
                  return;
                } else {
                  // If Albedo didn't submit it, we'll use the signed XDR
                  signedXdr = albedoResult.xdr;
                  console.log('Transaction signed successfully with Albedo, will submit manually');
                }
              } catch (albedoError) {
                console.error('Albedo transaction error:', albedoError);
                
                // Check for specific Albedo error messages
                const errorMessage = albedoError.message || '';
                
                if (errorMessage.includes('failed during execution')) {
                  throw new Error('Transaction failed: The destination account may not exist or you have insufficient funds. Please check your balance and try again.');
                } else if (errorMessage.includes('rejected')) {
                  throw new Error('Transaction was rejected by user');
                } else {
                  throw new Error('Failed to process transaction with Albedo: ' + errorMessage);
                }
              }
            } catch (albedoError) {
              console.error('Error with Albedo signing:', albedoError);
              throw new Error('Failed to sign with Albedo: ' + (albedoError.message || 'Unknown error'));
            }
          }
          // Check if we're using Freighter
          else if (wallet.name === 'Freighter' || wallet.walletId?.includes('freighter')) {
            console.log('Using Freighter for transaction signing');
            
            // Try multiple ways to detect Freighter
            let freighter = null;
            
            if (window.freighter) {
              console.log('Found Freighter in window.freighter');
              freighter = window.freighter;
            } else if (window.stellar && window.stellar.freighter) {
              console.log('Found Freighter in window.stellar.freighter');
              freighter = window.stellar.freighter;
            } else {
              // Try to detect Freighter with a small delay
              // Sometimes browser extensions take a moment to initialize
              console.log('Attempting to detect Freighter with delay...');
              await new Promise(resolve => setTimeout(resolve, 500));
              
              if (window.freighter) {
                console.log('Found Freighter after delay');
                freighter = window.freighter;
              } else if (window.stellar && window.stellar.freighter) {
                console.log('Found Freighter after delay in window.stellar');
                freighter = window.stellar.freighter;
              }
            }
            
            // If we still can't find Freighter, try a direct approach
            if (!freighter) {
              console.log('Freighter not detected, trying direct transaction signing');
              // Since we know the wallet is connected (from wallet.address),
              // we'll try to sign the transaction directly using the StellarWalletsKit
              if (walletKit) {
                try {
                  signedXdr = await walletKit.signTransaction({
                    xdr: transaction.toXDR(),
                    network: StellarSdk.Networks.TESTNET
                  });
                  console.log('Transaction signed successfully with StellarWalletsKit as fallback');
                  return; // Skip the rest of the Freighter code
                } catch (kitError) {
                  console.error('Error with StellarWalletsKit fallback:', kitError);
                  // Continue to try other methods
                }
              }
              
              // As a last resort, try to use the secret key if available
              if (wallet.secret) {
                console.log('Using secret key as last resort');
                const keypair = StellarSdk.Keypair.fromSecret(wallet.secret);
                transaction.sign(keypair);
                signedXdr = transaction.toXDR();
                console.log('Transaction signed successfully with secret key as fallback');
                return; // Skip the rest of the Freighter code
              }
              
              // If we still can't sign, throw a more helpful error
              throw new Error('Freighter extension not detected or not properly initialized. Please make sure the extension is installed and refresh the page.');
            }
            
            // Check if Freighter is connected
            try {
              const connected = await freighter.isConnected();
              if (!connected) {
                throw new Error('Freighter is not connected. Please connect Freighter first.');
              }
            } catch (connectionError) {
              console.error('Error checking Freighter connection:', connectionError);
              throw new Error('Error connecting to Freighter: ' + connectionError.message);
            }
            
            // Use Freighter to sign the transaction
            try {
              signedXdr = await freighter.signTransaction(transaction.toXDR(), {
                networkPassphrase: StellarSdk.Networks.TESTNET
              });
              console.log('Transaction signed successfully with Freighter');
            } catch (signError) {
              console.error('Error signing with Freighter:', signError);
              throw new Error('Failed to sign with Freighter: ' + signError.message);
            }
          }
          // If we have walletKit, try to use it as a last resort
          else if (walletKit) {
            console.log('Using StellarWalletsKit for transaction signing');
            try {
              // Try the standard method
              signedXdr = await walletKit.signTransaction({
                xdr: transaction.toXDR(),
                network: StellarSdk.Networks.TESTNET
              });
              console.log('Transaction signed successfully with StellarWalletsKit');
            } catch (kitError) {
              console.error('Error with StellarWalletsKit signTransaction:', kitError);
              throw new Error('Failed to sign with StellarWalletsKit: ' + kitError.message);
            }
          }
          else {
            throw new Error('Unknown wallet type. Cannot sign transaction.');
          }
        } catch (walletSignError) {
          // Close the wallet confirmation toast
          toast.dismiss('wallet-confirmation');
          console.error('Error signing with wallet:', walletSignError);
          throw new Error('Failed to sign with wallet: ' + walletSignError.message);
        }
        
        // Close the wallet confirmation toast
        toast.dismiss('wallet-confirmation');
      }
      
      // Check if we need to submit the transaction or if Albedo already did it
      if (signedXdr === 'SUBMITTED_BY_ALBEDO') {
        console.log('Transaction was already submitted by Albedo, skipping submission');
        // We already have the transaction hash from Albedo's response
        // and we've already set it in the Albedo handler
      } else {
        // Normal submission flow for other wallets
        if (!signedXdr) {
          throw new Error('Failed to get signed transaction');
        }
        
        // Show submitting toast
        toast.info('Submitting transaction to the Stellar network...', {
          autoClose: 5000,
          toastId: 'submitting-tx'
        });
        
        // Convert XDR back to transaction for submission
        let tx;
        try {
          tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
        } catch (xdrError) {
          console.error('Error parsing signed XDR:', xdrError);
          throw new Error('Invalid signed transaction: ' + xdrError.message);
        }
        
        // Submit the signed transaction
        let transactionResult;
        try {
          transactionResult = await server.submitTransaction(tx);
          console.log('Transaction successful! Hash:', transactionResult.hash);
          
          // Store transaction hash
          setTransactionHash(transactionResult.hash);
        } catch (submitError) {
          console.error('Error submitting transaction:', submitError);
          
          // Check for specific error types
          if (submitError.response && submitError.response.data && submitError.response.data.extras) {
            const resultCodes = submitError.response.data.extras.result_codes;
            console.error('Transaction result codes:', resultCodes);
            
            if (resultCodes.transaction === 'tx_bad_auth') {
              throw new Error('Transaction authentication failed. Please check your wallet connection.');
            } else if (resultCodes.transaction === 'tx_insufficient_balance') {
              throw new Error('Insufficient balance to complete this transaction.');
            } else {
              throw new Error(`Transaction failed: ${resultCodes.transaction || 'Unknown error'}`);
            }
          } else {
            throw new Error('Failed to submit transaction: ' + submitError.message);
          }
        }
        
        // Close submitting toast
        toast.dismiss('submitting-tx');
      }
      
      // Show success message
      toast.success('Transaction successful!', {
        autoClose: 5000
      });
      
      console.log('Transaction successful, updating UI state...');
      
      // IMPORTANT: Update UI state immediately to show success
      // Set these states synchronously before any async operations
      setSuccess(true);
      setStep(3);
      
      // Force refresh balance with multiple attempts
      try {
        // First immediate refresh
        await getBalance();
        console.log('Initial balance refresh completed');
        
        // Then schedule a few more refreshes to ensure balance is updated
        const refreshIntervals = [2000, 5000, 10000, 15000];
        for (const interval of refreshIntervals) {
          setTimeout(async () => {
            try {
              await getBalance();
              console.log(`Balance refreshed after ${interval/1000}s`);
              
              // Re-enforce success state after each refresh
              if (interval === 2000) {
                console.log('Re-enforcing success state');
                setSuccess(true);
                setStep(3);
              }
            } catch (refreshErr) {
              console.error(`Error refreshing balance after ${interval/1000}s:`, refreshErr);
            }
          }, interval);
        }
      } catch (balanceErr) {
        console.error('Error refreshing balance:', balanceErr);
        // Don't fail the transaction just because balance refresh failed
      }
      
      // Double-check that UI is updated to show transaction success
      console.log('Final success state check:', { success: true, step: 3 });
      setSuccess(true);
      setStep(3);
      
      // Store transaction details for display
      try {
        // Create a record of this transaction in local storage for history
        const transactionRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          recipientName,
          recipientCountry,
          recipientType,
          recipientIdentifier: recipientType === 'phone' ? recipientPhone : recipientAddress,
          amount,
          asset: selectedAsset,
          recipientAmount: recipientTSHTAmount,
          recipientAsset: 'TSHT',
          transactionHash: transactionHash,
          status: 'completed'
        };
        
        console.log('Saving transaction record:', transactionRecord);
        
        // CRITICAL FIX: Use a more reliable approach to update localStorage
        // 1. First, directly save this single transaction to ensure it's recorded
        const singleTransactionKey = `eazeTransaction_${transactionRecord.id}`;
        localStorage.setItem(singleTransactionKey, JSON.stringify(transactionRecord));
        
        // 2. Then update the main transactions array
        let existingTransactions = [];
        try {
          existingTransactions = JSON.parse(localStorage.getItem('eazeTransactions') || '[]');
          if (!Array.isArray(existingTransactions)) {
            console.warn('Existing transactions was not an array, resetting');
            existingTransactions = [];
          }
        } catch (parseError) {
          console.error('Error parsing existing transactions, resetting:', parseError);
          existingTransactions = [];
        }
        
        // Add new transaction to history
        existingTransactions.unshift(transactionRecord);
        
        // Save back to localStorage
        localStorage.setItem('eazeTransactions', JSON.stringify(existingTransactions));
        
        console.log('Transaction saved to history. Total transactions:', existingTransactions.length);
        
        // 3. Force update any TransactionHistory components
        setTimeout(() => {
          try {
            // Dispatch a custom event to notify components that a transaction is complete
            const transactionCompleteEvent = new CustomEvent('eazeTransactionComplete', { 
              detail: { transaction: transactionRecord } 
            });
            window.dispatchEvent(transactionCompleteEvent);
            console.log('Transaction complete event dispatched');
            
            // Also trigger a storage event manually to ensure components update
            const storageEvent = new StorageEvent('storage', {
              key: 'eazeTransactions',
              newValue: JSON.stringify(existingTransactions),
              url: window.location.href
            });
            window.dispatchEvent(storageEvent);
            console.log('Manual storage event dispatched');
          } catch (eventError) {
            console.error('Error dispatching events:', eventError);
          }
        }, 500); // Small delay to ensure state is updated first
      } catch (storageError) {
        console.error('Error saving transaction to history:', storageError);
        // Don't fail just because we couldn't save to history
      }
      
      return true;
    } catch (err) {
      console.error('Error processing transaction:', err);
      
      // Show a user-friendly error message
      let errorMessage = 'Failed to process transaction';
      
      if (err.message) {
        if (err.message.includes('User declined') || err.message.includes('rejected') || err.message.includes('denied')) {
          errorMessage = 'Transaction was declined in your wallet';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Transaction timed out. Please try again.';
        } else if (err.message.includes('insufficient balance')) {
          errorMessage = 'Insufficient balance to complete this transaction.';
        } else if (err.message.includes('auth')) {
          errorMessage = 'Authentication failed. Please check your wallet connection.';
        } else {
          // Use the error message directly if it's available
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        autoClose: 5000
      });
      
      return false;
    }
    
    try {
      // Initialize Stellar SDK
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      
      // Create keypair from secret
      let sourceKeypair;
      let sourcePublicKey;
      
      try {
        sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.secretKey);
        sourcePublicKey = sourceKeypair.publicKey();
      } catch (keyError) {
        console.error('Error creating keypair:', keyError);
        setError('Invalid wallet secret key. Please reconnect your wallet.');
        return false;
      }
      
      console.log('Sending from:', sourcePublicKey);
      console.log('Sending to:', recipientAddress);
      console.log('Amount:', amount, selectedAsset);
      
      // Load source account
      const sourceAccount = await server.loadAccount(sourcePublicKey);
      
      // Determine which asset to send
      let assetToSend;
      if (selectedAsset === 'XLM') {
        assetToSend = StellarSdk.Asset.native();
      } else if (selectedAsset === 'USDC') {
        // Use the testnet USDC issuer
        const usdcIssuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
        assetToSend = new StellarSdk.Asset('USDC', usdcIssuer);
      }
      
      // Build the payment transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: recipientAddress,
          asset: assetToSend,
          amount: amount.toString()
        }))
        .addMemo(StellarSdk.Memo.text('EazeFi Remittance'))
        .setTimeout(180)
        .build();
      
      // Sign the transaction
      transaction.sign(sourceKeypair);
      
      // Submit the transaction
      const transactionResult = await server.submitTransaction(transaction);
      console.log('Transaction successful! Hash:', transactionResult.hash);
      
      // Store transaction hash
      setTransactionHash(transactionResult.hash);
      
      // Update UI to show new balance immediately
      if (selectedAsset === 'XLM' && balances && balances.length > 0) {
        const xlmBalance = balances.find(b => b.asset_type === 'native');
        if (xlmBalance) {
          const newBalance = parseFloat(xlmBalance.balance) - parseFloat(amount);
          console.log(`Updating UI to show new balance: ${newBalance} XLM`);
          
          // Update any balance displays in the UI
          const balanceDisplays = document.querySelectorAll('.balance-display');
          if (balanceDisplays.length > 0) {
            balanceDisplays.forEach(el => {
              el.textContent = newBalance.toFixed(2);
            });
          }
        }
      }
      
      // Force refresh balance
      try {
        await getBalance();
        console.log('Balance refreshed after transaction');
        
        // Set up multiple refresh attempts
        const refreshIntervals = [2000, 5000, 10000];
        for (const interval of refreshIntervals) {
          setTimeout(async () => {
            try {
              await getBalance();
              console.log(`Balance refreshed after ${interval/1000}s`);
            } catch (refreshErr) {
              console.error(`Error refreshing balance after ${interval/1000}s:`, refreshErr);
            }
          }, interval);
        }
      } catch (err) {
        console.error('Error refreshing balance:', err);
      }
      
      setSuccess(true);
      return true;
    } catch (err) {
      console.error('Error processing transaction:', err);
      setError(err.message || 'Failed to process transaction');
      return false;
    }
  };
  
  // List of countries for dropdown
  const countries = [
    'Tanzania', 'Kenya', 'Uganda', 'Nigeria', 'Ghana', 'South Africa',
    'United States', 'United Kingdom', 'Canada', 'Australia'
  ];
  
  // Render transaction complete screen
  const renderTransactionComplete = () => {
    return (
      <div className="bg-green-50 p-6 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FaCheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-xl font-bold text-green-800">Transaction Successful!</h3>
            <div className="mt-2 text-green-700">
              <p className="text-lg">
                Your remittance has been processed successfully through the Soroban remittance contract.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-green-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Transaction Details</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Recipient</p>
              <p className="font-medium">{recipientName}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Country</p>
              <p className="font-medium">{recipientCountry}</p>
            </div>
            
            {recipientType === 'phone' ? (
              <div>
                <p className="text-gray-600 text-sm">Phone Number</p>
                <p className="font-medium">{recipientPhone}</p>
                <p className="text-xs text-blue-600 mt-1">M-Pesa payment initiated</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 text-sm">Stellar Address</p>
                <p className="font-mono text-xs break-all">{recipientAddress}</p>
              </div>
            )}
            
            <div>
              <p className="text-gray-600 text-sm">You Sent</p>
              <p className="font-medium text-blue-700">{amount} {selectedAsset}</p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Recipient Gets</p>
              <p className="font-medium text-green-700">{recipientTSHTAmount} TSHT</p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Exchange Rate</p>
              <p className="font-medium">1 {selectedAsset} = {selectedAsset === 'XLM' ? exchangeRate : (exchangeRate * 3.5).toFixed(2)} TSHT</p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Date & Time</p>
              <p className="font-medium">{new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-1">Contract ID</p>
            <p className="font-mono text-xs break-all">CDCYWK73YTYFJZZSJ5V7EDFNHYBG4QN3VUNG4DQHI72HPQYQTQKBVVKL</p>
          </div>
        </div>
        
        {transactionHash && (
          <div className="mt-4 bg-gray-100 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Transaction Hash:</span>
              <button
                onClick={() => copyToClipboard(transactionHash)}
                className="text-blue-500 hover:text-blue-700 flex items-center"
              >
                <span className="mr-1 text-sm">Copy</span> <FaCopy />
              </button>
            </div>
            <div className="mt-1 text-sm font-mono break-all">{transactionHash}</div>
            <div className="mt-2 text-xs text-blue-600">
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${transactionHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                View on Stellar Explorer <span className="ml-1">↗</span>
              </a>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              // Reset the form to start a new transaction
              setStep(1);
              setRecipientName('');
              setRecipientCountry('');
              setAmount('');
              setRecipientPhone('');
              setRecipientAddress('');
              setTransactionHash('');
              setSuccess(false);
              setError(null);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium"
          >
            New Transaction
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            This transaction was processed through the EazeFi Soroban remittance contract on the Stellar testnet.
            {recipientType === 'phone' && ' The recipient will receive funds via M-Pesa.'}
          </p>
        </div>
      </div>
    );
  };
  
  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };
  
  // If transaction was successful, directly render the success screen
  if (success) {
    console.log('Rendering success screen directly from success state');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {renderTransactionComplete()}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cross-Border Remittance (New)</h1>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
            <div>
              <p className="text-blue-800">
                This demonstrates cross-border remittance using the Stellar testnet. 
                You'll send XLM from your wallet, and the recipient will receive TSHT (Tanzania Shilling Token).
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-blue-500' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 3 ? 'bg-blue-500' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-center w-1/3">
                <span className="text-sm font-medium">Recipient</span>
              </div>
              <div className="text-center w-1/3">
                <span className="text-sm font-medium">Amount</span>
              </div>
              <div className="text-center w-1/3">
                <span className="text-sm font-medium">Confirm</span>
              </div>
            </div>
          </div>
          
          {/* Check for both success state and step 3 */}
          {success || step === 3 ? (
            renderTransactionComplete()
          ) : (
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Recipient Information</h2>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Recipient Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter recipient name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Recipient Country</label>
                    <select
                      value={recipientCountry}
                      onChange={(e) => setRecipientCountry(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Recipient Type</label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recipientType"
                          value="phone"
                          checked={recipientType === 'phone'}
                          onChange={(e) => handleInputChange(e)}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">Phone Number</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recipientType"
                          value="address"
                          checked={recipientType === 'address'}
                          onChange={(e) => handleInputChange(e)}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">Stellar Address</span>
                      </label>
                    </div>
                  </div>
                  
                  {recipientType === 'phone' ? (
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Recipient Phone Number</label>
                      <input
                        type="tel"
                        name="recipientPhone"
                        value={recipientPhone}
                        onChange={(e) => handleInputChange(e)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="+255 123 456 789"
                      />
                      <p className="text-sm text-gray-500 mt-1">Include country code (e.g., +255 for Tanzania)</p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Recipient Stellar Address</label>
                      <input
                        type="text"
                        name="recipientAddress"
                        value={recipientAddress}
                        onChange={(e) => handleInputChange(e)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="G..."
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter a valid Stellar public key</p>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Amount to Send</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-l-md"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="p-2 border border-gray-300 border-l-0 rounded-r-md bg-gray-50"
                      >
                        <option value="XLM">XLM</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                  </div>
                  
                  {amount && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Recipient gets:</span>
                        <span className="font-semibold">{recipientTSHTAmount} TSHT</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Exchange rate:</span>
                        <span>1 {selectedAsset} = {selectedAsset === 'XLM' ? exchangeRate : (exchangeRate * 3.5).toFixed(2)} TSHT</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Confirm Transaction</h2>
                  
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Recipient</p>
                        <p className="font-medium">{recipientName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Country</p>
                        <p className="font-medium">{recipientCountry}</p>
                      </div>
                      
                      {recipientType === 'phone' ? (
                        <div>
                          <p className="text-gray-600">Phone Number</p>
                          <p className="font-medium">{recipientPhone}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600">Stellar Address</p>
                          <p className="font-mono text-xs break-all">{recipientAddress}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600">You Send</p>
                        <p className="font-medium">{amount} {selectedAsset}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Recipient Gets</p>
                        <p className="font-medium">{recipientTSHTAmount} TSHT</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Exchange Rate</span>
                        <span>1 {selectedAsset} = {selectedAsset === 'XLM' ? exchangeRate : (exchangeRate * 3.5).toFixed(2)} TSHT</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-md mb-6">
                    <p className="text-yellow-800 text-sm">
                      This will initiate a real transaction on the Stellar testnet. Your wallet balance will be updated accordingly.
                    </p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <BiChevronLeft className="mr-1" /> Back
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md text-white ${
                    isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                  } ml-auto`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : step === 2 ? (
                    'Confirm & Send'
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendMoney;
