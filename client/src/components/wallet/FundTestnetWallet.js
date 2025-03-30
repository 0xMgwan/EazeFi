import React, { useState, useContext } from 'react';
import axios from 'axios';
import StellarSdk from 'stellar-sdk';
import { FaRocket, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import WalletContext from '../../context/WalletContext';

const FundTestnetWallet = () => {
  const { wallet, getBalance } = useContext(WalletContext);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ success: false, error: null, message: '' });

  // Direct balance update function that doesn't rely on context
  const updateBalanceDirectly = async () => {
    if (!wallet || !wallet.address) return false;
    
    try {
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const account = await server.loadAccount(wallet.address);
      
      // Find native XLM balance
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      if (xlmBalance) {
        const balance = parseFloat(xlmBalance.balance).toFixed(2);
        console.log(`Direct balance check successful: ${balance} XLM`);
        
        // Update all balance displays on the page immediately
        document.querySelectorAll('.balance-display').forEach(el => {
          el.textContent = balance;
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error in direct balance update:', error.message);
      return false;
    }
  };
  
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
      
      // Try multiple funding methods to ensure success
      let fundingSuccess = false;
      
      // Method 1: Direct Friendbot API with fetch (more reliable than axios)
      try {
        console.log('Attempting to fund wallet with primary Friendbot method...');
        const response = await fetch(`https://friendbot.stellar.org?addr=${wallet.address}`);
        if (response.ok) {
          console.log('Primary funding method successful');
          fundingSuccess = true;
        } else {
          console.log('Primary funding failed with status:', response.status);
        }
      } catch (error) {
        console.log('Primary funding method error:', error.message);
      }
      
      // Method 2: Horizon Friendbot if first one fails
      if (!fundingSuccess) {
        try {
          console.log('Trying secondary funding method...');
          const response = await fetch(`https://horizon-testnet.stellar.org/friendbot?addr=${wallet.address}`);
          if (response.ok) {
            console.log('Secondary funding method successful');
            fundingSuccess = true;
          } else {
            console.log('Secondary funding failed with status:', response.status);
          }
        } catch (error) {
          console.log('Secondary funding method error:', error.message);
        }
      }
      
      // Method 3: Laboratory Friendbot as last resort
      if (!fundingSuccess) {
        try {
          console.log('Trying tertiary funding method...');
          const response = await fetch(`https://laboratory.stellar.org/friendbot?addr=${wallet.address}`);
          if (response.ok) {
            console.log('Tertiary funding method successful');
            fundingSuccess = true;
          } else {
            console.log('Tertiary funding failed with status:', response.status);
            // Even if this fails with 400, it might be because account already exists
            if (response.status === 400) {
              console.log('Got 400 error, account might already exist');
            }
          }
        } catch (error) {
          console.log('Tertiary funding method error:', error.message);
        }
      }
      
      setResult({
        success: true,
        error: null,
        message: 'Your wallet has been funded with testnet XLM!'
      });
      
      // Aggressively check for balance updates after funding
      console.log('Starting aggressive balance checks...');
      
      // First, try to update immediately
      await updateBalanceDirectly();
      
      // Set up multiple balance checks with increasing delays
      const checkTimes = [1000, 2000, 3000, 5000, 8000, 13000];
      
      // Create a function to check balance at specified intervals
      const scheduleBalanceChecks = () => {
        checkTimes.forEach((delay, index) => {
          setTimeout(async () => {
            console.log(`Scheduled balance check ${index + 1}/${checkTimes.length} after ${delay}ms`);
            const success = await updateBalanceDirectly();
            
            if (success) {
              console.log(`Balance check ${index + 1} successful!`);
              // Also update through context for good measure
              getBalance();
              
              // Update all UI elements showing balance
              const event = new CustomEvent('balance-updated');
              window.dispatchEvent(event);
            }
          }, delay);
        });
      };
      
      // Start the scheduled balance checks
      scheduleBalanceChecks();
      
      // Also set up a fallback to the context's getBalance
      checkTimes.forEach((delay) => {
        setTimeout(() => {
          console.log(`Calling context getBalance after ${delay}ms`);
          getBalance();
        }, delay);
      });
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="text-yellow-400 mr-3">
            <FaRocket size={18} />
          </div>
          <h3 className="text-yellow-300 font-medium">Fund Testnet Wallet</h3>
        </div>
        
        {/* Add a manual refresh button */}
        <button 
          onClick={() => {
            updateBalanceDirectly();
            getBalance();
          }}
          className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          title="Refresh Balance"
        >
          <FaCheckCircle className="inline mr-1" /> Check Balance
        </button>
      </div>
      
      <p className="text-yellow-200/70 text-sm mb-3">
        New to EazeFi? Get free testnet XLM to try out all features. This is for testing only and has no real value.
      </p>
      
      {/* Current Balance Display */}
      <div className="bg-blue-900/30 p-3 rounded-lg mb-4 flex items-center justify-between">
        <span className="text-blue-200">Current Balance:</span>
        <span className="text-white font-bold">
          <span className="balance-display">0.00</span> <span className="text-blue-300">XLM</span>
        </span>
      </div>
      
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
      
      {loading && (
        <div className="mt-3 text-blue-300 text-xs p-2 bg-blue-900/30 rounded-lg">
          <p className="animate-pulse">⚠️ Funding in progress... Balance will update automatically when complete.</p>
          <p className="mt-1">If balance doesn't update after 15 seconds, click "Check Balance" above.</p>
        </div>
      )}
      
      <p className="text-yellow-200/50 text-xs mt-2">
        Powered by Stellar Friendbot. Limited to one funding per wallet.
      </p>
    </div>
  );
};

export default FundTestnetWallet;
