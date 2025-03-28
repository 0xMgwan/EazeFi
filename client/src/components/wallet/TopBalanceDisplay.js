import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BiRefresh } from 'react-icons/bi';

const TopBalanceDisplay = ({ walletAddress }) => {
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    
    try {
      const response = await axios.get(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
      const account = response.data;
      
      // Find native XLM balance
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      if (xlmBalance) {
        const amount = parseFloat(xlmBalance.balance).toFixed(2);
        setBalance(amount);
        setLastUpdated(new Date());
      } else {
        setBalance('0.00');
      }
    } catch (error) {
      console.error('Error fetching balance for main display:', error);
      setBalance('0.00');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      
      // Set up auto-refresh every 30 seconds
      const intervalId = setInterval(fetchBalance, 30000);
      return () => clearInterval(intervalId);
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
            {balance} <span className="text-blue-400">XLM</span>
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
