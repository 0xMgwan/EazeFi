import React, { useState, useContext } from 'react';
import axios from 'axios';
import StellarSdk from 'stellar-sdk';
import { FaRocket, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import WalletContext from '../../context/WalletContext';

const FundTestnetWallet = () => {
  const { wallet, getBalance } = useContext(WalletContext);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ success: false, error: null, message: '' });

  const fundWalletWithFriendbot = async () => {
    if (!wallet || !wallet.address) {
      setResult({
        success: false,
        error: 'No wallet connected',
        message: 'Please connect your wallet first.'
      });
      return;
    }

    setLoading(true);
    setResult({ success: false, error: null, message: '' });

    try {
      // Check if the wallet is already funded
      try {
        // Initialize Stellar SDK with proper network
        const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
        const account = await server.loadAccount(wallet.address);
        
        // If we get here, the account exists and is funded
        console.log('Account already exists:', account.account_id);
        
        // Check if the account has XLM
        const hasXLM = account.balances.some(balance => 
          balance.asset_type === 'native' && parseFloat(balance.balance) > 0
        );
        
        if (hasXLM) {
          setResult({
            success: true,
            error: null,
            message: 'Your wallet is already funded with testnet XLM! Refresh to see your balance.'
          });
          
          // Refresh balance
          getBalance();
          return;
        }
      } catch (accountError) {
        // Account doesn't exist yet, which is fine - we'll create it
        console.log('Account not found, will create with Friendbot');
      }
      
      // Call Friendbot API to fund the wallet
      // Use a different endpoint that's more reliable
      try {
        console.log('Attempting to fund wallet with Friendbot...');
        const response = await axios.get(`https://friendbot.stellar.org?addr=${wallet.address}`);
        console.log('Funding successful:', response.data);
      } catch (fundingError) {
        // If Friendbot fails, try the laboratory friendbot as a backup
        console.log('Primary Friendbot failed, trying backup method...');
        try {
          const labResponse = await axios.get(`https://laboratory.stellar.org/friendbot?addr=${wallet.address}`);
          console.log('Backup funding successful:', labResponse.data);
        } catch (labError) {
          // If both fail but it's a 400 error, the account might already exist
          if (labError.response && labError.response.status === 400) {
            console.log('Account may already exist, proceeding with balance check');
          } else {
            // For other errors, rethrow to be caught by the outer catch block
            throw labError;
          }
        }
      }
      
      setResult({
        success: true,
        error: null,
        message: 'Your wallet has been funded with testnet XLM!'
      });
      
      // Create a function to force a direct balance update without using the context
      const forceDirectBalanceUpdate = async () => {
        try {
          console.log('Forcing direct balance update...');
          const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
          
          try {
            // Try to load the account directly
            const account = await server.loadAccount(wallet.address);
            
            // Find native XLM balance
            const xlmBalance = account.balances.find(b => b.asset_type === 'native');
            if (xlmBalance) {
              const balance = parseFloat(xlmBalance.balance).toFixed(2);
              console.log(`Direct balance check successful: ${balance} XLM`);
              
              // Update the UI immediately with the new balance
              document.querySelectorAll('.balance-display').forEach(el => {
                el.textContent = `${balance} XLM`;
              });
              
              // Also update through context
              getBalance();
              return true;
            }
          } catch (loadError) {
            console.log('Account not found yet, retrying soon...');
            return false;
          }
        } catch (err) {
          console.error('Error in direct balance update:', err);
          return false;
        }
      };
      
      // Immediately try to refresh balance
      await forceDirectBalanceUpdate();
      
      // Set up a more aggressive refresh strategy with shorter intervals
      let attempts = 0;
      const maxAttempts = 10; // Increase max attempts
      
      const refreshBalance = async () => {
        attempts++;
        console.log(`Attempting to refresh balance (attempt ${attempts} of ${maxAttempts})`);
        
        const success = await forceDirectBalanceUpdate();
        
        // If successful or we haven't reached max attempts, schedule another refresh
        if (!success && attempts < maxAttempts) {
          setTimeout(refreshBalance, 1500); // Even faster refresh interval
        } else if (success) {
          console.log('Balance refresh successful!');
          // Force one more context update to be sure
          setTimeout(() => getBalance(), 1000);
        }
      };
      
      // Start the first refresh after a short delay
      setTimeout(refreshBalance, 500);
    } catch (error) {
      console.error('Error funding wallet:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fund wallet.';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'This wallet has already been funded. Each wallet can only be funded once with Friendbot.';
        } else if (error.response.status === 429) {
          errorMessage = 'Too many funding requests. Please try again later.';
        } else {
          errorMessage = error.response.data?.detail || 'Stellar Friendbot service error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message || 'Unknown error occurred.';
      }
      
      setResult({
        success: false,
        error: error.message,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4 mb-4">
      <div className="flex items-center mb-3">
        <div className="text-yellow-400 mr-3">
          <FaRocket size={18} />
        </div>
        <h3 className="text-yellow-300 font-medium">Fund Testnet Wallet</h3>
      </div>
      
      <p className="text-yellow-200/70 text-sm mb-4">
        New to EazeFi? Get free testnet XLM to try out all features. This is for testing only and has no real value.
      </p>
      
      {result.message && (
        <div className={`p-3 rounded mb-4 ${result.success ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
          <div className="flex items-center">
            {result.success ? (
              <FaCheckCircle className="text-green-400 mr-2" />
            ) : (
              <FaExclamationCircle className="text-red-400 mr-2" />
            )}
            <p className={`text-sm ${result.success ? 'text-green-300' : 'text-red-300'}`}>
              {result.message}
            </p>
          </div>
        </div>
      )}
      
      <button
        onClick={fundWalletWithFriendbot}
        disabled={loading || !wallet || result.success}
        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-all duration-300 ${
          loading 
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
            : result.success
              ? 'bg-green-500/20 text-green-300 border border-green-500/30 cursor-default'
              : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-yellow-300 border-t-transparent rounded-full mr-2"></div>
            Funding Wallet...
          </>
        ) : result.success ? (
          <>
            <FaCheckCircle className="mr-2" size={14} />
            Wallet Successfully Funded!
          </>
        ) : (
          <>
            <FaRocket className="mr-2" size={14} />
            Fund Wallet with Testnet XLM
          </>
        )}
      </button>
      
      <p className="text-yellow-200/50 text-xs mt-2">
        Powered by Stellar Friendbot. Limited to one funding per wallet.
      </p>
    </div>
  );
};

export default FundTestnetWallet;
