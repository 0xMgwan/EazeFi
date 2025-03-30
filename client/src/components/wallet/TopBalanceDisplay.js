import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BiRefresh } from 'react-icons/bi';

const TopBalanceDisplay = ({ walletAddress }) => {
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const fetchBalance = async () => {
    if (!walletAddress) {
      setLoading(false);
      setBalance('0.00');
      return;
    }
    
    setLoading(true);
    console.log('Fetching balance for wallet:', walletAddress);
    
    // Create a timeout promise that rejects after a specified time
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 5000); // 5 second timeout
    });
    
    try {
      // Race the fetch against the timeout
      const response = await Promise.race([
        fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Use a cache-busting query parameter to avoid cached responses
          cache: 'no-store'
        }),
        timeoutPromise
      ]);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Account not found on Stellar network. Wallet may need funding.');
          setBalance('0.00');
        } else {
          console.error(`Error fetching balance: ${response.status} ${response.statusText}`);
          setBalance('0.00');
        }
        setLoading(false);
        return;
      }
      
      const account = await response.json();
      
      // Find native XLM balance
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      if (xlmBalance) {
        const amount = parseFloat(xlmBalance.balance).toFixed(2);
        console.log(`Balance found: ${amount} XLM`);
        setBalance(amount);
        setLastUpdated(new Date());
        
        // Update all balance displays on the page for immediate feedback
        document.querySelectorAll('.balance-display').forEach(el => {
          el.textContent = amount;
        });
      } else {
        console.log('No XLM balance found in account');
        setBalance('0.00');
      }
    } catch (error) {
      // Check if it's a timeout error
      if (error.message === 'Request timed out') {
        console.error('Stellar API request timed out. Network may be slow or unavailable.');
        setBalance('--');
        // Try a different API endpoint as fallback
        try {
          console.log('Attempting fallback API endpoint...');
          // Use a different Stellar API endpoint or a proxy
          const fallbackResponse = await fetch('https://horizon.stellar.org/accounts/' + walletAddress, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-store'
          });
          
          if (fallbackResponse.ok) {
            const account = await fallbackResponse.json();
            const xlmBalance = account.balances.find(b => b.asset_type === 'native');
            if (xlmBalance) {
              const amount = parseFloat(xlmBalance.balance).toFixed(2);
              console.log(`Balance found via fallback: ${amount} XLM`);
              setBalance(amount);
              setLastUpdated(new Date());
              
              // Update all balance displays on the page for immediate feedback
              document.querySelectorAll('.balance-display').forEach(el => {
                el.textContent = amount;
              });
            }
          } else {
            console.error(`Fallback API also failed: ${fallbackResponse.status}`);
            setBalance('0.00');
          }
        } catch (fallbackError) {
          console.error('Fallback API request also failed:', fallbackError);
          setBalance('0.00');
        }
      } else {
        console.error('Error fetching balance for main display:', error.message || error);
        setBalance('0.00');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add a direct balance fetch function that doesn't rely on the Horizon API
  const fetchDirectBalance = async () => {
    if (!walletAddress) return false;
    
    try {
      console.log('Directly fetching balance from Stellar network...');
      // Use fetch instead of axios for more reliable error handling
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
      
      if (!response.ok) {
        console.log(`Account fetch failed with status: ${response.status}`);
        return false;
      }
      
      const account = await response.json();
      
      // Find native XLM balance
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      if (xlmBalance) {
        const amount = parseFloat(xlmBalance.balance).toFixed(2);
        console.log(`Direct balance check successful: ${amount} XLM`);
        setBalance(amount);
        setLastUpdated(new Date());
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error in direct balance update:', err);
      return false;
    }
  };
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Wallet address detected, fetching balance immediately');
      // Try both methods to ensure we get a balance
      fetchBalance();
      fetchDirectBalance();
      
      // Fetch balance multiple times with shorter intervals initially
      const immediateRefreshes = [
        setTimeout(() => {
          fetchBalance();
          fetchDirectBalance();
        }, 1000),
        setTimeout(() => {
          fetchBalance();
          fetchDirectBalance();
        }, 3000),
        setTimeout(() => {
          fetchBalance();
          fetchDirectBalance();
        }, 6000),
        setTimeout(() => {
          fetchBalance();
          fetchDirectBalance();
        }, 10000)
      ];
      
      // Then set up regular auto-refresh every 15 seconds
      const intervalId = setInterval(() => {
        fetchBalance();
        fetchDirectBalance();
      }, 15000);
      
      return () => {
        clearInterval(intervalId);
        immediateRefreshes.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [walletAddress]);
  
  return (
    <div className="flex flex-col">
      <div className="text-gray-400 text-sm flex items-center justify-between w-full">
        <span>Total Balance</span>
        <button 
          onClick={fetchBalance}
          className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
          title="Refresh balance"
        >
          <BiRefresh className="inline text-sm" /> Sync
        </button>
      </div>
      
      <div className="text-2xl font-bold text-white">
        {loading ? (
          <span className="text-gray-400 animate-pulse">Loading...</span>
        ) : parseFloat(balance) > 0 ? (
          <>
            <span className="balance-display">{balance}</span> <span className="text-blue-400">XLM</span>
            {lastUpdated && (
              <div className="text-xs text-green-500 mt-1">
                ✓ Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </>
        ) : (
          <>
            0.00 <span className="text-blue-400">XLM</span>
            <div className="text-xs text-yellow-500 mt-1">
              This wallet may not be funded on testnet. 
              <a 
                href="https://laboratory.stellar.org/#account-creator?network=test" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline ml-1"
              >
                Get testnet XLM
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TopBalanceDisplay;
