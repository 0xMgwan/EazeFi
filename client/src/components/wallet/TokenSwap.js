import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { WalletContext } from '../../context/WalletContext';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../layout/Spinner';
import { FaExchangeAlt, FaChartLine, FaInfoCircle } from 'react-icons/fa';

const TokenSwap = () => {
  const { wallet, loadWallet } = useContext(WalletContext);
  const { loadUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [slippageTolerance, setSlippageTolerance] = useState(1); // Default 1%
  const [estimatedReceive, setEstimatedReceive] = useState(0);
  const [liquidityInfo, setLiquidityInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load available trading pairs
  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const res = await axios.get('/api/sdex/pairs');
        setPairs(res.data);
        if (res.data.length > 0) {
          setSelectedPair(res.data[0]);
        }
      } catch (err) {
        console.error('Error fetching trading pairs:', err);
        setError('Could not load trading pairs');
      }
    };

    fetchPairs();
  }, []);

  // Update exchange rate when pair or amount changes
  useEffect(() => {
    if (selectedPair && amount && parseFloat(amount) > 0) {
      fetchExchangeRate();
    } else {
      setExchangeRate(null);
      setEstimatedReceive(0);
    }
  }, [selectedPair, amount]);

  // Fetch exchange rate
  const fetchExchangeRate = async () => {
    if (!selectedPair || !amount || parseFloat(amount) <= 0) return;

    try {
      setLoading(true);
      const res = await axios.get('/api/sdex/rate', {
        params: {
          sourceAsset: selectedPair.baseAsset,
          destAsset: selectedPair.counterAsset,
          amount
        }
      });
      
      setExchangeRate(res.data.exchangeRate);
      setEstimatedReceive(res.data.destAmount);
      
      // Also fetch liquidity info
      const liquidityRes = await axios.get('/api/sdex/liquidity', {
        params: {
          baseAsset: selectedPair.baseAsset,
          counterAsset: selectedPair.counterAsset
        }
      });
      
      setLiquidityInfo(liquidityRes.data);
      setError('');
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      setError('Could not determine exchange rate');
    } finally {
      setLoading(false);
    }
  };

  // Handle swap execution
  const handleSwap = async (e) => {
    e.preventDefault();
    
    if (!selectedPair || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const res = await axios.post('/api/sdex/swap', {
        sellAsset: selectedPair.baseAsset,
        buyAsset: selectedPair.counterAsset,
        amount,
        slippageTolerance
      });
      
      setSuccess(`Swap successful! You received ${res.data.swap.buyAmount} ${selectedPair.counterAsset.split(':')[0]}`);
      
      // Reload wallet to show updated balances
      await loadWallet();
      await loadUser();
      
      // Reset form
      setAmount('');
      setEstimatedReceive(0);
      setExchangeRate(null);
    } catch (err) {
      console.error('Error executing swap:', err);
      setError(err.response?.data?.msg || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  // Format asset code for display
  const formatAssetCode = (assetString) => {
    if (!assetString) return '';
    const [code, issuer] = assetString.split(':');
    return issuer ? `${code} (${issuer.substring(0, 4)}...)` : code;
  };

  // Handle pair selection
  const handlePairChange = (e) => {
    const pairIndex = parseInt(e.target.value);
    setSelectedPair(pairs[pairIndex]);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <FaExchangeAlt className="mr-2 text-blue-500" /> Token Swap
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSwap}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Trading Pair
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={handlePairChange}
            disabled={loading}
          >
            {pairs.map((pair, index) => (
              <option key={index} value={index}>
                {formatAssetCode(pair.baseAsset)} → {formatAssetCode(pair.counterAsset)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Amount to Swap ({selectedPair ? formatAssetCode(selectedPair.baseAsset) : ''})
          </label>
          <input
            type="number"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            min="0"
            step="0.000001"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Slippage Tolerance (%)
          </label>
          <input
            type="number"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={slippageTolerance}
            onChange={(e) => setSlippageTolerance(e.target.value)}
            disabled={loading}
            min="0.1"
            max="5"
            step="0.1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximum acceptable difference between expected and actual price
          </p>
        </div>
        
        {exchangeRate && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Exchange Rate:</span>
              <span className="text-gray-900">
                1 {selectedPair ? formatAssetCode(selectedPair.baseAsset) : ''} = {exchangeRate.toFixed(6)} {selectedPair ? formatAssetCode(selectedPair.counterAsset) : ''}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">You'll Receive:</span>
              <span className="text-gray-900 font-bold">
                {parseFloat(estimatedReceive).toFixed(6)} {selectedPair ? formatAssetCode(selectedPair.counterAsset) : ''}
              </span>
            </div>
            {liquidityInfo && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <FaInfoCircle className="mr-1" /> 
                  <span>Spread: {liquidityInfo.spreadPercentage.toFixed(2)}%</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaChartLine className="mr-1" /> 
                  <span>Liquidity: {parseFloat(liquidityInfo.totalLiquidity).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            disabled={loading || !amount || parseFloat(amount) <= 0 || !exchangeRate}
          >
            {loading ? <Spinner size="sm" /> : 'Swap Tokens'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TokenSwap;
