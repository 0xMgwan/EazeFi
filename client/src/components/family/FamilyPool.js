import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';

const FamilyPool = () => {
  const { familyPools, getFamilyPools, contributeToPool, withdrawFromPool, loading } = useContext(WalletContext);
  const [selectedPool, setSelectedPool] = useState(null);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  useEffect(() => {
    getFamilyPools();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      setStatusMessage({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage({ type: '', message: '' });
    
    try {
      const result = await contributeToPool(selectedPool.id, contributionAmount);
      if (result && result.success) {
        setShowContributeModal(false);
        setContributionAmount('');
        setStatusMessage({ type: 'success', message: `Successfully contributed ${contributionAmount} ${selectedPool.token} to ${selectedPool.name}` });
      }
    } catch (err) {
      console.error('Error contributing to pool:', err);
      setStatusMessage({ type: 'error', message: err.message || 'Error contributing to pool' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setStatusMessage({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage({ type: '', message: '' });
    
    try {
      const result = await withdrawFromPool(selectedPool.id, withdrawalAmount, withdrawalReason);
      if (result && result.success) {
        setShowWithdrawModal(false);
        setWithdrawalAmount('');
        setWithdrawalReason('');
        setStatusMessage({ type: 'success', message: `Successfully withdrew ${withdrawalAmount} ${selectedPool.token} from ${selectedPool.name}` });
      }
    } catch (err) {
      console.error('Error withdrawing from pool:', err);
      setStatusMessage({ type: 'error', message: err.message || 'Error withdrawing from pool' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openContributeModal = (pool) => {
    setSelectedPool(pool);
    setShowContributeModal(true);
    setStatusMessage({ type: '', message: '' });
  };

  const openWithdrawModal = (pool) => {
    setSelectedPool(pool);
    setShowWithdrawModal(true);
    setStatusMessage({ type: '', message: '' });
  };

  // Calculate pool statistics
  const calculatePoolStats = (pool) => {
    // Ensure contributions and withdrawals exist with fallbacks
    const contributions = pool.contributions || [];
    const withdrawals = pool.withdrawals || [];
    
    const totalContributions = contributions.length > 0 ?
      contributions.reduce((sum, contribution) => sum + parseFloat(contribution.amount || 0), 0) : 0;
      
    const totalWithdrawals = withdrawals.length > 0 ?
      withdrawals.reduce((sum, withdrawal) => sum + parseFloat(withdrawal.amount || 0), 0) : 0;
      
    // For pools without transaction history, use the balance directly
    const currentBalance = pool.balance !== undefined ? 
      pool.balance : (totalContributions - totalWithdrawals);
    
    return {
      totalContributions,
      totalWithdrawals,
      currentBalance,
      contributorsCount: contributions.length > 0 ? 
        new Set(contributions.map(c => c.contributorId || '')).size : 
        pool.members?.length || 0
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow-md">
        <div className="flex items-center">
          <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">Tanzanian Shilling (TSHT) support coming soon! Stay tuned for updates.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Family Pools</h1>
          <p className="text-gray-600 mt-2">Manage shared funds with your family members</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/family-pools/create" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <i className="fas fa-plus mr-2"></i> Create New Pool
          </Link>
        </div>
      </div>

      {statusMessage.message && (
        <div className={`mb-4 p-4 rounded-lg ${statusMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {statusMessage.message}
        </div>
      )}

      {familyPools && familyPools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyPools.map((pool) => {
            const stats = calculatePoolStats(pool);
            
            return (
              <div key={pool.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{pool.name}</h2>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      pool.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {pool.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.currentBalance.toFixed(2)} {pool.token}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Contributors</div>
                      <div className="text-lg font-semibold">{stats.contributorsCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Created</div>
                      <div className="text-lg font-semibold">{formatDate(pool.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Total Contributed</div>
                      <div className="text-lg font-semibold text-green-600">
                        +{stats.totalContributions.toFixed(2)} {pool.token}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Total Withdrawn</div>
                      <div className="text-lg font-semibold text-red-600">
                        -{stats.totalWithdrawals.toFixed(2)} {pool.token}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 -mx-6 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Withdrawal Limit</div>
                        <div className="font-medium">
                          {parseFloat(pool.withdrawalLimit).toFixed(2)} {pool.token} / {pool.withdrawalPeriod}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openContributeModal(pool)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                        >
                          Contribute
                        </button>
                        <button
                          onClick={() => openWithdrawModal(pool)}
                          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                          disabled={!pool.isActive}
                        >
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-6 py-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h3>
                  
                  {[...pool.contributions, ...pool.withdrawals]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3)
                    .map((activity, index) => (
                      <div key={index} className="flex items-center py-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          'amount' in activity ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {'amount' in activity ? (
                            <i className="fas fa-arrow-up"></i>
                          ) : (
                            <i className="fas fa-arrow-down"></i>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium">
                            {'amount' in activity ? 'Contribution' : 'Withdrawal'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(activity.createdAt)}
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${
                          'amount' in activity ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {'amount' in activity ? '+' : '-'}
                          {parseFloat(activity.amount).toFixed(2)} {pool.token}
                        </div>
                      </div>
                    ))}
                  
                  {[...pool.contributions, ...pool.withdrawals].length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No activity yet
                    </div>
                  )}
                  
                  {[...pool.contributions, ...pool.withdrawals].length > 3 && (
                    <div className="text-center mt-2">
                      <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                        View All Activity
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <i className="fas fa-users text-5xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Pools Found</h3>
          <p className="text-gray-500 mb-6">
            Create your first family pool to start managing shared funds with your loved ones.
          </p>
          <Link 
            to="/family-pools/create" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Your First Pool
          </Link>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Contribute to Pool</h3>
              <button 
                onClick={() => setShowContributeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {statusMessage.message && statusMessage.type === 'error' && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {statusMessage.message}
              </div>
            )}
            
            <form onSubmit={handleContributeSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="poolName">
                  Pool Name
                </label>
                <input
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  id="poolName"
                  type="text"
                  value={selectedPool.name}
                  disabled
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contributionAmount">
                  Contribution Amount ({selectedPool.token})
                </label>
                <input
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="contributionAmount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                  disabled={isSubmitting || !contributionAmount || parseFloat(contributionAmount) <= 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Contributing...
                    </span>
                  ) : (
                    'Contribute'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Withdraw Modal */}
      {showWithdrawModal && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Withdraw from Pool</h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {statusMessage.message && statusMessage.type === 'error' && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {statusMessage.message}
              </div>
            )}
            
            <form onSubmit={handleWithdrawSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="poolNameWithdraw">
                  Pool Name
                </label>
                <input
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  id="poolNameWithdraw"
                  type="text"
                  value={selectedPool.name}
                  disabled
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="withdrawalAmount">
                  Withdrawal Amount ({selectedPool.token})
                </label>
                <input
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="withdrawalAmount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Withdrawal limit: {selectedPool.withdrawalLimit} {selectedPool.token} per {selectedPool.withdrawalPeriod}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="withdrawalReason">
                  Reason (optional)
                </label>
                <textarea
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="withdrawalReason"
                  placeholder="Enter reason for withdrawal"
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                  disabled={isSubmitting || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Withdrawing...
                    </span>
                  ) : (
                    'Withdraw'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyPool;
