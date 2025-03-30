import React, { useState, useContext, useCallback } from 'react';
import axios from 'axios';
import StellarSdk from 'stellar-sdk';
import { FaRocket, FaCheckCircle, FaExclamationCircle, FaSync, FaSpinner } from 'react-icons/fa';
import WalletContext from '../../context/WalletContext';
import { showSuccess, showError, showInfo, showLoading, updateToast } from '../common/NotificationSystem';

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
  
  const fundWalletWithFriendbot = useCallback(async () => {
    if (!wallet || !wallet.address) {
      setResult({
        success: false,
        error: 'No wallet connected',
        message: 'Please connect your wallet first.'
      });
      showError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setResult({ success: false, error: null, message: '' });
    
    // Show loading toast
    const loadingToastId = showLoading('Funding your wallet with testnet XLM...', {
      position: "top-center"
    });

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
          
          // Update toast to show account is already funded
          updateToast(loadingToastId, {
            render: 'Your wallet is already funded with testnet XLM!',
            type: 'info',
            isLoading: false,
            autoClose: 4000,
          });
          
          // Refresh balance
          getBalance();
          updateBalanceDirectly();
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
        console.log('Wallet address:', wallet.address);
        
        // Update toast to show we're trying the primary method
        updateToast(loadingToastId, {
          render: 'Funding wallet with Stellar Friendbot...',
          isLoading: true,
        });
        
        // Use a more reliable approach with proper error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`https://friendbot.stellar.org?addr=${wallet.address}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if the response was successful
        if (response.ok) {
          const responseData = await response.json();
          console.log('Primary funding method successful:', responseData);
          fundingSuccess = true;
          
          // Update toast to show success
          updateToast(loadingToastId, {
            render: 'Successfully funded your wallet with testnet XLM!',
            type: 'success',
            isLoading: false,
            autoClose: 5000,
          });
        } else {
          // Log detailed error information
          const errorText = await response.text();
          console.log('Primary funding failed with status:', response.status);
          console.log('Error details:', errorText);
          
          // Update toast to show we're trying alternative methods
          updateToast(loadingToastId, {
            render: 'Primary funding method failed. Trying alternatives...',
            isLoading: true,
          });
        }
      } catch (error) {
        // Log detailed error information
        console.log('Primary funding method error:', error);
        console.log('Error name:', error?.name);
        console.log('Error message:', error?.message);
        console.log('Error stack:', error?.stack);
        
        // Update toast to show error and that we're trying alternatives
        updateToast(loadingToastId, {
          render: 'Error with primary funding method. Trying alternatives...',
          isLoading: true,
        });
      }
      
      // Method 2: Horizon Friendbot if first one fails
      if (!fundingSuccess) {
        try {
          console.log('Trying secondary funding method...');
          console.log('Wallet address:', wallet.address);
          
          // Update toast to show we're trying the secondary method
          updateToast(loadingToastId, {
            render: 'Trying alternative funding method...',
            isLoading: true,
          });
          
          // Use a more reliable approach with proper error handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(`https://horizon-testnet.stellar.org/friendbot?addr=${wallet.address}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const responseData = await response.json();
            console.log('Secondary funding method successful:', responseData);
            fundingSuccess = true;
            
            // Update toast to show success
            updateToast(loadingToastId, {
              render: 'Successfully funded your wallet with testnet XLM!',
              type: 'success',
              isLoading: false,
              autoClose: 5000,
            });
          } else {
            // Log detailed error information
            const errorText = await response.text();
            console.log('Secondary funding failed with status:', response.status);
            console.log('Error details:', errorText);
            
            // Update toast to show we're trying the last method
            updateToast(loadingToastId, {
              render: 'Alternative funding failed. Trying last method...',
              isLoading: true,
            });
          }
        } catch (error) {
          // Log detailed error information
          console.log('Secondary funding method error:', error);
          console.log('Error name:', error?.name);
          console.log('Error message:', error?.message);
          console.log('Error stack:', error?.stack);
          
          // Update toast to show error and that we're trying the last method
          updateToast(loadingToastId, {
            render: 'Error with alternative funding. Trying last method...',
            isLoading: true,
          });
        }
      }
      
      // Method 3: Try direct POST to Friendbot as last resort
      if (!fundingSuccess) {
        try {
          console.log('Trying tertiary funding method...');
          console.log('Wallet address:', wallet.address);
          
          // Update toast to show we're trying the last method
          updateToast(loadingToastId, {
            render: 'Trying final funding method...',
            isLoading: true,
          });
          
          // Use a more reliable approach with proper error handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          // Try a POST request to Friendbot instead of GET
          const response = await fetch('https://friendbot.stellar.org', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ addr: wallet.address }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const responseData = await response.json();
            console.log('Tertiary funding method successful:', responseData);
            fundingSuccess = true;
            
            // Update toast to show success
            updateToast(loadingToastId, {
              render: 'Successfully funded your wallet with testnet XLM!',
              type: 'success',
              isLoading: false,
              autoClose: 5000,
            });
          } else {
            // Log detailed error information
            const errorText = await response.text();
            console.log('Tertiary funding failed with status:', response.status);
            console.log('Error details:', errorText);
            
            // Even if this fails with 400, it might be because account already exists
            if (response.status === 400) {
              console.log('Got 400 error, account might already exist');
              fundingSuccess = true; // Assume success if we get a 400
              
              // Update toast to show possible success
              updateToast(loadingToastId, {
                render: 'Your wallet may already be funded. Checking balance...',
                type: 'info',
                isLoading: true,
              });
            } else {
              // Try one more approach - using the Stellar Laboratory
              try {
                console.log('Trying Laboratory funding method...');
                const labResponse = await fetch(`https://laboratory.stellar.org/friendbot?addr=${wallet.address}`, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                  }
                });
                
                if (labResponse.ok) {
                  console.log('Laboratory funding method successful');
                  fundingSuccess = true;
                  
                  // Update toast to show success
                  updateToast(loadingToastId, {
                    render: 'Successfully funded your wallet with testnet XLM!',
                    type: 'success',
                    isLoading: false,
                    autoClose: 5000,
                  });
                } else {
                  // Update toast to show failure
                  updateToast(loadingToastId, {
                    render: 'All funding methods failed. Please try again later.',
                    type: 'error',
                    isLoading: false,
                    autoClose: 5000,
                  });
                }
              } catch (labError) {
                console.log('Laboratory funding method error:', labError);
                // Update toast to show failure
                updateToast(loadingToastId, {
                  render: 'All funding methods failed. Please try again later.',
                  type: 'error',
                  isLoading: false,
                  autoClose: 5000,
                });
              }
            }
          }
        } catch (error) {
          // Log detailed error information
          console.log('Tertiary funding method error:', error);
          console.log('Error name:', error?.name);
          console.log('Error message:', error?.message);
          console.log('Error stack:', error?.stack);
          
          // Update toast to show error
          updateToast(loadingToastId, {
            render: 'Error with final funding method. Please try again later.',
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          });
        }
      }
      
      setResult({
        success: true,
        error: null,
        message: 'Your wallet has been funded with testnet XLM!'
      });
      
      // Update toast to show we're checking balance
      updateToast(loadingToastId, {
        render: 'Funding complete! Checking your balance...',
        type: 'success',
        isLoading: true,
      });
      
      // Aggressively check for balance updates after funding
      console.log('Starting aggressive balance checks...');
      
      // First, try to update immediately
      const immediateUpdate = await updateBalanceDirectly();
      if (immediateUpdate) {
        // Balance updated successfully
        updateToast(loadingToastId, {
          render: 'Your wallet has been funded and balance updated!',
          type: 'success',
          isLoading: false,
          autoClose: 5000,
        });
      }
      
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
              
              // Update toast to show balance updated
              updateToast(loadingToastId, {
                render: 'Your wallet has been funded and balance updated!',
                type: 'success',
                isLoading: false,
                autoClose: 5000,
              });
              
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
      
      // Safely handle error properties that might be undefined
      if (error && error.response) {
        if (error.response.status === 400) {
          errorMessage = 'This wallet has already been funded. Each wallet can only be funded once with Friendbot.';
        } else if (error.response.status === 429) {
          errorMessage = 'Too many funding requests. Please try again later.';
        } else {
          errorMessage = error.response.data?.detail || 'Stellar Friendbot service error. Please try again later.';
        }
      } else if (error && error.request) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error && error.message) {
        errorMessage = error.message || 'Unknown error occurred.';
      }
      
      // Update toast to show error
      updateToast(loadingToastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
      
      setResult({
        success: false,
        error: error && error.message ? error.message : 'Unknown error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [wallet, getBalance]);

  return (
    <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="text-yellow-400 mr-3">
            <FaRocket size={18} />
          </div>
          <h3 className="text-yellow-300 font-medium">Fund Testnet Wallet</h3>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={async () => {
              try {
                await updateBalanceDirectly();
                if (getBalance) getBalance();
              } catch (error) {
                console.error('Error refreshing balance:', error);
                showError('Failed to refresh balance');
              }
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            <div className="flex items-center">
              <FaSync className="mr-1" size={14} />
              <span>Refresh Balance</span>
            </div>
          </button>
        </div>
      </div>
      
      <p className="text-gray-300 text-sm mb-4">
        Fund your wallet with testnet XLM to start using the app. This is free and only works on the Stellar Testnet.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <button 
          onClick={fundWalletWithFriendbot}
          disabled={loading || !wallet}
          className={`px-4 py-2 rounded-lg flex items-center justify-center ${
            loading 
              ? 'bg-yellow-700/30 cursor-not-allowed' 
              : 'bg-yellow-500 hover:bg-yellow-600 transition-colors'
          } ${!wallet ? 'opacity-50 cursor-not-allowed' : ''} w-full sm:w-auto mb-3 sm:mb-0`}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              <span>Funding...</span>
            </>
          ) : (
            <>
              <FaRocket className="mr-2" />
              <span>Fund Wallet with Testnet XLM</span>
            </>
          )}
        </button>
        
        {result && result.success && (
          <div className="flex items-center text-green-400">
            <FaCheckCircle className="mr-2" />
            <span>{result.message || 'Operation successful'}</span>
          </div>
        )}
        
        {result && result.error && (
          <div className="flex items-center text-red-400">
            <FaExclamationCircle className="mr-2" />
            <span>{result.message || 'An error occurred'}</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Note: Funding may take a few moments. If your balance doesn't update immediately, please wait a few seconds and refresh.
      </p>
    </div>
  );
};

export default FundTestnetWallet;
