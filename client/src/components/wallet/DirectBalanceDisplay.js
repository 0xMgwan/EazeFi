import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BiRefresh } from 'react-icons/bi';

const DirectBalanceDisplay = ({ walletAddress }) => {
  const [directBalance, setDirectBalance] = useState('0.00');
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
    } catch (error) {
      console.error('Error fetching direct balance:', error);
      setError('Failed to fetch balance');
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
