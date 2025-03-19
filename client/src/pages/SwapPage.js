import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { WalletContext } from '../context/WalletContext';
import TokenSwap from '../components/wallet/TokenSwap';
import PriceChart from '../components/wallet/PriceChart';
import Spinner from '../components/layout/Spinner';
import { FaExchangeAlt, FaWallet, FaInfoCircle } from 'react-icons/fa';

const SwapPage = () => {
  const { isAuthenticated, loading: authLoading, user } = useContext(AuthContext);
  const { wallet, loading: walletLoading } = useContext(WalletContext);
  const [selectedPair, setSelectedPair] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchTradingPairs();
    }
  }, [isAuthenticated, authLoading]);

  const fetchTradingPairs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/sdex/pairs');
      setPairs(res.data);
      if (res.data.length > 0) {
        setSelectedPair(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching trading pairs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format asset code for display
  const formatAssetCode = (assetString) => {
    if (!assetString) return '';
    const [code, issuer] = assetString.split(':');
    return code;
  };

  if (authLoading || walletLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 flex items-center">
          <FaExchangeAlt className="mr-2 text-blue-500" /> Token Swap
        </h1>
        {wallet && (
          <div className="bg-blue-50 p-3 rounded-lg flex items-center">
            <FaWallet className="text-blue-500 mr-2" />
            <span className="font-medium">Wallet Balance:</span>
            <span className="ml-2">{wallet.balance} {wallet.currency}</span>
          </div>
        )}
      </div>

      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaInfoCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Swap tokens instantly using the Stellar Decentralized Exchange (SDEX). Get the best rates with minimal slippage.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TokenSwap />
        </div>
        <div>
          {selectedPair && (
            <PriceChart 
              baseAsset={selectedPair.baseAsset} 
              counterAsset={selectedPair.counterAsset} 
            />
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Available Trading Pairs</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pair
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Asset
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counter Asset
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pairs.map((pair, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAssetCode(pair.baseAsset)}/{formatAssetCode(pair.counterAsset)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatAssetCode(pair.baseAsset)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatAssetCode(pair.counterAsset)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedPair(pair)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Chart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
