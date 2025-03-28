import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { WalletContext } from '../../context/WalletContext';
import { FaWallet, FaExchangeAlt, FaPaperPlane, FaUsers, FaHistory, FaChartLine, FaArrowRight, FaCheckCircle, FaRegClock, FaChevronRight } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { wallet, getWallet } = useContext(WalletContext);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentRemittances, setRecentRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, these would be API calls
        await getWallet();
        
        // Mock data for demonstration
        setRecentTransactions([
          {
            id: 'tx1',
            type: 'Deposit',
            amount: '500.00',
            currency: 'USD',
            date: '2025-03-15T10:30:00Z',
            status: 'Completed'
          },
          {
            id: 'tx2',
            type: 'Swap',
            amount: '200.00',
            currency: 'USD',
            targetCurrency: 'EUR',
            targetAmount: '185.20',
            date: '2025-03-17T14:45:00Z',
            status: 'Completed'
          }
        ]);
        
        setRecentRemittances([
          {
            id: 'rem1',
            recipient: 'John Doe',
            amount: '300.00',
            currency: 'EUR',
            date: '2025-03-16T09:15:00Z',
            status: 'Completed'
          },
          {
            id: 'rem2',
            recipient: 'Jane Smith',
            amount: '150.00',
            currency: 'GBP',
            date: '2025-03-18T11:20:00Z',
            status: 'Pending'
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getWallet]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl shadow-lg p-8 mb-10 animate-slide-up">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-300 text-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {wallet && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 animate-pulse-shadow">
              <p className="text-sm font-medium text-gray-300 uppercase tracking-wider">Current Balance</p>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-white mt-1">
                  {wallet.balance}
                </p>
                <span className="text-gray-300 ml-2">{wallet.currency}</span>
              </div>
              <Link to="/wallet" className="text-xs text-white hover:text-gray-300 flex items-center mt-2">
                View details <FaArrowRight className="ml-1" size={10} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Link
          to="/wallet"
          className="bg-white hover:bg-gray-50 rounded-xl shadow-sm p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-black group"
        >
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <FaWallet className="text-white text-xl" />
          </div>
          <span className="text-black font-medium text-base text-center">Wallet</span>
          <p className="text-gray-500 text-xs text-center mt-1">Manage assets</p>
        </Link>

        <Link
          to="/swap"
          className="bg-white hover:bg-gray-50 rounded-xl shadow-sm p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-black group"
        >
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <FaExchangeAlt className="text-white text-xl" />
          </div>
          <span className="text-black font-medium text-base text-center">Swap</span>
          <p className="text-gray-500 text-xs text-center mt-1">Exchange currencies</p>
        </Link>

        <Link
          to="/send-money"
          className="bg-white hover:bg-gray-50 rounded-xl shadow-sm p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-black group"
        >
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <FaPaperPlane className="text-white text-xl" />
          </div>
          <span className="text-black font-medium text-base text-center">Send Money</span>
          <p className="text-gray-500 text-xs text-center mt-1">Transfer funds</p>
        </Link>

        <Link
          to="/family-pools"
          className="bg-white hover:bg-gray-50 rounded-xl shadow-sm p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-black group"
        >
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <FaUsers className="text-white text-xl" />
          </div>
          <span className="text-black font-medium text-base text-center">Family Pool</span>
          <p className="text-gray-500 text-xs text-center mt-1">Group finances</p>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Total Balance</h3>
            <div className="bg-black text-white p-2 rounded-lg">
              <FaWallet size={18} />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{wallet?.balance || '0'}</span>
            <span className="text-gray-500 ml-2">{wallet?.currency || 'XLM'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/wallet" className="text-black hover:underline flex items-center text-sm font-medium">
              View wallet details <FaArrowRight className="ml-1" size={12} />
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Monthly Activity</h3>
            <div className="bg-black text-white p-2 rounded-lg">
              <FaChartLine size={18} />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{recentTransactions.length || 0}</span>
            <span className="text-gray-500 ml-2">transactions</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/wallet" className="text-black hover:underline flex items-center text-sm font-medium">
              View all transactions <FaArrowRight className="ml-1" size={12} />
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Remittances Sent</h3>
            <div className="bg-black text-white p-2 rounded-lg">
              <FaPaperPlane size={18} />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{recentRemittances?.length || 0}</span>
            <span className="text-gray-500 ml-2">this month</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/remittances" className="text-black hover:underline flex items-center text-sm font-medium">
              View all remittances <FaArrowRight className="ml-1" size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-10">
        <div className="border-b border-gray-100 p-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Activity Overview</h2>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button 
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'transactions' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
              </button>
              <button 
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'remittances' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveTab('remittances')}
              >
                Remittances
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          {activeTab === 'transactions' ? (
            recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-3 rounded-full mr-4">
                        {tx.type === 'Swap' ? <FaExchangeAlt className="text-black" /> : <FaHistory className="text-black" />}
                      </div>
                      <div>
                        <h3 className="font-medium">{tx.type}</h3>
                        <p className="text-gray-500 text-sm">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        <p className="font-bold">
                          {tx.type === 'Swap' 
                            ? <span>
                                {tx.amount} <span className="text-gray-600">{tx.currency}</span>
                                <span className="mx-1">→</span>
                                {tx.targetAmount} <span className="text-gray-600">{tx.targetCurrency}</span>
                              </span>
                            : <span>
                                {tx.amount} <span className="text-gray-600">{tx.currency}</span>
                              </span>
                          }
                        </p>
                        <p className="text-xs text-gray-500">{tx.status}</p>
                      </div>
                      <div>
                        {tx.status === 'Completed' ? 
                          <FaCheckCircle className="text-green-500" /> : 
                          <FaRegClock className="text-yellow-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHistory className="text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-500 mb-4">No transactions yet</p>
                <Link to="/send-money" className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300 inline-flex items-center">
                  Send your first transaction <FaArrowRight className="ml-2" size={12} />
                </Link>
              </div>
            )
          ) : (
            // Remittances tab content
            recentRemittances.length > 0 ? (
              <div className="space-y-4">
                {recentRemittances.map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-3 rounded-full mr-4">
                        <FaPaperPlane className="text-black" />
                      </div>
                      <div>
                        <h3 className="font-medium">To: {rem.recipient}</h3>
                        <p className="text-gray-500 text-sm">{formatDate(rem.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        <p className="font-bold">
                          {rem.amount} <span className="text-gray-600">{rem.currency}</span>
                        </p>
                        <p className="text-xs text-gray-500">{rem.status}</p>
                      </div>
                      <div>
                        {rem.status === 'Completed' ? 
                          <FaCheckCircle className="text-green-500" /> : 
                          <FaRegClock className="text-yellow-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPaperPlane className="text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-500 mb-4">No remittances yet</p>
                <Link to="/send-money" className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300 inline-flex items-center">
                  Send your first remittance <FaArrowRight className="ml-2" size={12} />
                </Link>
              </div>
            )
          )}
        </div>
        
        <div className="border-t border-gray-100 p-4 bg-gray-50 text-center">
          <Link to={activeTab === 'transactions' ? "/wallet" : "/remittances"} className="text-black hover:underline flex items-center justify-center text-sm font-medium">
            View All {activeTab === 'transactions' ? 'Transactions' : 'Remittances'} <FaArrowRight className="ml-1" size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
