import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';
import AuthContext from '../../context/AuthContext';
import { getDepositInfo, initiateDeposit, initiateWithdrawal, getTransactions } from '../../utils/sepUtils';

const DepositWithdraw = () => {
  const { balances, getBalance } = useContext(WalletContext);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('deposit');
  const [assetCode, setAssetCode] = useState('TSHT');
  const [amount, setAmount] = useState('');
  const [depositInfo, setDepositInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [interactiveUrl, setInteractiveUrl] = useState('');
  
  // Available regulated tokens
  const regulatedTokens = [
    { code: 'TSHT', name: 'Tanzanian Shilling Token' },
    { code: 'NGNT', name: 'Nigerian Naira Token' },
    { code: 'KEST', name: 'Kenyan Shilling Token' }
  ];
  
  useEffect(() => {
    const fetchDepositInfo = async () => {
      try {
        setLoading(true);
        const info = await getDepositInfo(token);
        setDepositInfo(info);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching deposit info:', err);
        setError('Failed to fetch deposit information');
        setLoading(false);
      }
    };
    
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const txs = await getTransactions(token);
        setTransactions(txs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setLoading(false);
      }
    };
    
    if (token) {
      fetchDepositInfo();
      fetchTransactions();
    }
    
    // Refresh balances
    getBalance();
  }, [token, getBalance]);
  
  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get the connected wallet address
      const account = localStorage.getItem('stellarAddress');
      
      if (!account) {
        setError('Please connect your wallet first');
        setLoading(false);
        return;
      }
      
      const result = await initiateDeposit(token, assetCode, amount, account);
      
      if (result.type === 'interactive_customer_info_needed') {
        setInteractiveUrl(result.url);
        setSuccess('Please complete the deposit process in the opened window');
      } else {
        setSuccess('Deposit initiated successfully');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error initiating deposit:', err);
      setError(err.response?.data?.error || 'Failed to initiate deposit');
      setLoading(false);
    }
  };
  
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get the connected wallet address
      const account = localStorage.getItem('stellarAddress');
      
      if (!account) {
        setError('Please connect your wallet first');
        setLoading(false);
        return;
      }
      
      const result = await initiateWithdrawal(token, assetCode, amount, account);
      
      if (result.type === 'interactive_customer_info_needed') {
        setInteractiveUrl(result.url);
        setSuccess('Please complete the withdrawal process in the opened window');
      } else {
        setSuccess('Withdrawal initiated successfully');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error initiating withdrawal:', err);
      setError(err.response?.data?.error || 'Failed to initiate withdrawal');
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading && !depositInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Deposit & Withdraw</h1>
        
        {interactiveUrl && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Complete Your Transaction</h2>
            <p className="text-gray-600 mb-4">Please complete your transaction by clicking the button below:</p>
            <a 
              href={interactiveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Complete Transaction
            </a>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'deposit' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('deposit')}
            >
              Deposit
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'withdraw' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('withdraw')}
            >
              Withdraw
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('history')}
            >
              Transaction History
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'deposit' && (
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assetCode">
                    Asset
                  </label>
                  <select
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="assetCode"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                  >
                    {regulatedTokens.map((token) => (
                      <option key={token.code} value={token.code}>
                        {token.name} ({token.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                    Amount
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Deposit'}
                  </button>
                </div>
              </form>
            )}
            
            {activeTab === 'withdraw' && (
              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assetCode">
                    Asset
                  </label>
                  <select
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="assetCode"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                  >
                    {regulatedTokens.map((token) => (
                      <option key={token.code} value={token.code}>
                        {token.name} ({token.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                    Amount
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </form>
            )}
            
            {activeTab === 'history' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h2>
                
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Asset
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                tx.kind === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {tx.kind.charAt(0).toUpperCase() + tx.kind.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {tx.asset_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {tx.amount_in}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                tx.status === 'pending_external' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1).replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatDate(tx.started_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No transactions found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositWithdraw;
