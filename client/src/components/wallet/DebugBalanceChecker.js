import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const DebugBalanceChecker = ({ walletAddress, onBalanceFound }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ success: false, data: null, error: null });

  const checkBalanceDirectly = async () => {
    if (!walletAddress) {
      setResult({
        success: false,
        data: null,
        error: 'No wallet address provided'
      });
      return;
    }

    setLoading(true);
    setResult({ success: false, data: null, error: null });

    try {
      console.log(`Directly checking balance for: ${walletAddress}`);
      
      // Call Horizon API directly
      const response = await axios.get(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
      const account = response.data;
      
      console.log('Account found on Stellar network:', account);
      
      // Extract native XLM balance
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      const xlmAmount = xlmBalance ? parseFloat(xlmBalance.balance).toFixed(2) : '0.00';
      
      console.log(`XLM Balance: ${xlmAmount}`);
      
      // Format all balances
      const formattedBalances = account.balances.map(balance => {
        if (balance.asset_type === 'native') {
          return { asset: 'XLM', amount: parseFloat(balance.balance).toFixed(2) };
        } else {
          return { 
            asset: balance.asset_code || balance.asset_type, 
            amount: parseFloat(balance.balance).toFixed(2)
          };
        }
      });
      
      setResult({
        success: true,
        data: {
          xlmBalance: xlmAmount,
          allBalances: formattedBalances
        },
        error: null
      });
      
      // Call the callback with the balance data
      if (onBalanceFound && typeof onBalanceFound === 'function') {
        onBalanceFound(formattedBalances);
      }
    } catch (error) {
      console.error('Error checking balance directly:', error);
      
      let errorMessage = 'Failed to check balance';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Account not found on Stellar network. It may not be funded yet.';
        } else {
          errorMessage = `API Error: ${error.response.status} - ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
      
      setResult({
        success: false,
        data: null,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
      <h3 className="text-blue-300 text-sm font-medium mb-2">Debug: Direct Balance Check</h3>
      
      <button
        onClick={checkBalanceDirectly}
        disabled={loading || !walletAddress}
        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-all duration-300 ${
          loading 
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-blue-300 border-t-transparent rounded-full mr-2"></div>
            Checking Balance...
          </>
        ) : (
          <>
            <FaSearch className="mr-2" size={14} />
            Check Actual Balance on Stellar Network
          </>
        )}
      </button>
      
      {result.success && result.data && (
        <div className="mt-3 p-3 bg-green-500/20 rounded border border-green-500/30">
          <div className="flex items-center mb-2">
            <FaCheckCircle className="text-green-400 mr-2" />
            <p className="text-green-300 font-medium">Balance Found!</p>
          </div>
          <p className="text-sm text-green-200">XLM Balance: <span className="font-mono">{result.data.xlmBalance}</span></p>
          <div className="mt-2">
            <p className="text-xs text-green-200/70">All balances:</p>
            <ul className="mt-1 text-xs font-mono text-green-200/70">
              {result.data.allBalances.map((balance, index) => (
                <li key={index}>{balance.asset}: {balance.amount}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {result.error && (
        <div className="mt-3 p-3 bg-red-500/20 rounded border border-red-500/30">
          <div className="flex items-center">
            <FaExclamationCircle className="text-red-400 mr-2" />
            <p className="text-sm text-red-300">{result.error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugBalanceChecker;
