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
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Directly fetching balance for:', walletAddress);
      const response = await axios.get(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
      const account = response.data;
      
      // Find native XLM balance
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      if (xlmBalance) {
        const amount = parseFloat(xlmBalance.balance).toFixed(2);
        console.log('Found XLM balance:', amount);
        setDirectBalance(amount);
        setLastChecked(new Date());
      } else {
        console.log('No XLM balance found in account');
        setDirectBalance('0.00');
      }
      
      // Check for TSHT tokens
      const tshtBalance = account.balances.find(b => 
        b.asset_code === 'TSHT' && 
        b.asset_issuer === 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );
      
      if (tshtBalance) {
        const amount = parseFloat(tshtBalance.balance).toFixed(2);
        console.log('Found TSHT balance:', amount);
        setTshtBalance(amount);
        setHasTsht(true);
      } else {
        console.log('No TSHT tokens found in account');
        setTshtBalance('0.00');
        setHasTsht(false);
      }
    } catch (error) {
      console.error('Error fetching direct balance:', error);
      
      // Handle 404 errors specifically (account not found)
      if (error.response && error.response.status === 404) {
        console.log('Account not found on Stellar network. Wallet may need funding.');
        setError('Account not found. Try funding your wallet first.');
      } else {
        setError('Failed to fetch balance');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch balance on mount and when address changes
  useEffect(() => {
    if (walletAddress) {
      fetchDirectBalance();
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
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : (
            <>
              {directBalance} <span className="text-blue-400">XLM</span>
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
