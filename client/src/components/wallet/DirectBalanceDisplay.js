import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BiRefresh } from 'react-icons/bi';
import { FaCheckCircle } from 'react-icons/fa';

const DirectBalanceDisplay = ({ walletAddress }) => {
  const [directBalance, setDirectBalance] = useState('0.00');
  const [tshtBalance, setTshtBalance] = useState('0.00');
  const [hasTsht, setHasTsht] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  
  // Function to directly fetch balance from Stellar network
  const fetchDirectBalance = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Define multiple endpoints to try in case of failure
    const endpoints = [
      `https://horizon-testnet.stellar.org/accounts/${walletAddress}`,
      `https://horizon.stellar.org/accounts/${walletAddress}`,
      `https://horizon-testnet.stellar.org/accounts/${walletAddress}?_=${Date.now()}` // With cache busting
    ];
    
    let success = false;
    let lastError = null;
    
    // Try each endpoint until one succeeds
    for (let i = 0; i < endpoints.length && !success; i++) {
      try {
        console.log(`Attempt ${i+1}: Fetching from ${endpoints[i]}`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 5000);
        });
        
        // Race the fetch against the timeout
        const response = await Promise.race([
          fetch(endpoints[i], {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
          }),
          timeoutPromise
        ]);
        
        if (!response.ok) {
          if (response.status === 404 || response.status === 400) {
            console.log(`Account not found or not created yet (status: ${response.status}). This is normal for new wallets.`);
            setDirectBalance('0.00');
            setTshtBalance('0.00');
            setHasTsht(false);
            setError('Account not active yet. Fund your wallet to activate it.');
            setLoading(false);
            return;
          } else {
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
          }
        }
        
        const account = await response.json();
        
        // Find native XLM balance
        const xlmBalance = account.balances.find(b => b.asset_type === 'native');
        if (xlmBalance) {
          const amount = parseFloat(xlmBalance.balance).toFixed(2);
          console.log('Found XLM balance:', amount);
          setDirectBalance(amount);
          setLastChecked(new Date());
          setError(null); // Clear any previous errors
          
          // Update all balance displays on the page for immediate feedback
          document.querySelectorAll('.balance-display').forEach(el => {
            el.textContent = amount;
          });
        } else {
          console.log('No XLM balance found in account');
          setDirectBalance('0.00');
        }
        
        // Check for TSHT tokens (Tanzania Shilling Token)
        const tshtAssetBalance = account.balances.find(b => 
          b.asset_code === 'TSHT' && 
          b.asset_issuer === 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
        );
        
        if (tshtAssetBalance) {
          const amount = parseFloat(tshtAssetBalance.balance).toFixed(2);
          console.log('Found TSHT balance:', amount);
          setTshtBalance(amount);
          setHasTsht(true);
        } else {
          console.log('No TSHT tokens found in account');
          setTshtBalance('0.00');
          setHasTsht(false);
        }
        
        // Mark this attempt as successful
        success = true;
        
      } catch (error) {
        console.error(`Error with endpoint ${endpoints[i]}:`, error.message || error);
        lastError = error;
        // Continue to the next endpoint
      }
    }
    
    // If all attempts failed, show an error
    if (!success) {
      console.error('All balance fetch attempts failed:', lastError);
      setDirectBalance('--');
      setTshtBalance('--');
      setHasTsht(false);
      setError(`Network error: ${lastError?.message || 'Could not connect to Stellar network'}. Try again later.`);
    }
    
    setLoading(false);
  };
  
  // Fetch balance on mount and when address changes
  useEffect(() => {
    if (walletAddress) {
      console.log('Wallet address available, fetching direct balance immediately');
      fetchDirectBalance();
      
      // Fetch balance multiple times with shorter intervals initially for better responsiveness
      const immediateRefreshes = [
        setTimeout(() => fetchDirectBalance(), 2000),  // 2 seconds
        setTimeout(() => fetchDirectBalance(), 5000),  // 5 seconds
      ];
      
      // Set up automatic refresh every 15 seconds for ongoing updates
      const refreshInterval = setInterval(() => {
        fetchDirectBalance();
      }, 15000);
      
      return () => {
        clearInterval(refreshInterval);
        immediateRefreshes.forEach(timeout => clearTimeout(timeout));
      };
    } else {
      // Reset state if wallet address is not available
      setDirectBalance('0.00');
      setTshtBalance('0.00');
      setHasTsht(false);
      setLoading(false);
      setError(null);
    }
  }, [walletAddress]);
  
  return (
    <div className="mt-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
      <h3 className="text-blue-300 text-sm font-medium mb-2">Direct Balance Check</h3>
      
      <div className="bg-gray-800/50 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Actual Balance on Stellar Network:</span>
          <button 
            onClick={fetchDirectBalance}
            className="text-blue-400 hover:text-blue-300 transition-colors"
            title="Refresh balance"
          >
            <BiRefresh className="text-lg" />
          </button>
        </div>
        
        <div className="text-xl font-bold text-white">
          {loading ? (
            <span className="text-gray-400 animate-pulse">Loading...</span>
          ) : (
            <>
              <span className="balance-display">{directBalance}</span> <span className="text-blue-400">XLM</span>
              {error && (
                <div className="text-amber-400 text-xs mt-1">{error}</div>
              )}
            </>
          )}
        </div>
        
        {/* TSHT Balance Display */}
        {!loading && !error && (
          <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/30">
            <div className="flex items-center justify-between">
              <span className="text-green-300 text-sm">TSHT Tokens:</span>
              <span className="text-xs bg-green-600/30 px-2 py-0.5 rounded-full text-green-300">Tanzania Shilling</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {hasTsht ? tshtBalance : '0.00'} <span className="text-green-400">TSHT</span>
            </div>
            <div className="text-green-400/70 text-xs mt-1">
              {hasTsht 
                ? 'Remittance tokens received' 
                : 'Complete a remittance to receive TSHT tokens'}
            </div>
            <button 
              onClick={() => {
                if (walletAddress) {
                  // Add TSHT token to wallet
                  window.open('https://laboratory.stellar.org/#account-creator?network=test', '_blank');
                  alert('To add TSHT tokens to your wallet, use the Stellar Laboratory to create a trustline with:\n\nAsset Code: TSHT\nIssuer: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
                }
              }}
              className="mt-2 w-full text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 py-1 px-2 rounded border border-green-500/30"
            >
              {hasTsht ? 'View TSHT Details' : 'Add TSHT to Wallet'}
            </button>
          </div>
        )}
        
        {lastChecked && !loading && !error && (
          <div className="text-xs text-green-500 mt-1">
            ✓ Verified at {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectBalanceDisplay;
