import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';

const Remittances = () => {
  const { remittances, getUserRemittances, loading } = useContext(WalletContext);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getUserRemittances();
  }, [getUserRemittances]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter remittances based on status
  const filteredRemittances = remittances.filter(remittance => {
    if (filter === 'all') return true;
    return remittance.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Remittances</h1>
          <p className="text-gray-600 mt-2">Track and manage your money transfers</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/send-money" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <i className="fas fa-paper-plane mr-2"></i> Send Money
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-wrap">
            <button
              className={`px-4 py-2 mr-2 mb-2 rounded-full text-sm font-medium ${
                filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 mr-2 mb-2 rounded-full text-sm font-medium ${
                filter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`px-4 py-2 mr-2 mb-2 rounded-full text-sm font-medium ${
                filter === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
            <button
              className={`px-4 py-2 mr-2 mb-2 rounded-full text-sm font-medium ${
                filter === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>

        {filteredRemittances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRemittances.map((remittance) => (
                  <tr key={remittance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(remittance.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-500 font-medium">
                            {remittance.recipientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{remittance.recipientName}</div>
                          <div className="text-sm text-gray-500">{remittance.recipientPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {parseFloat(remittance.amount).toFixed(2)} {remittance.sourceToken}
                      </div>
                      <div className="text-sm text-gray-500">
                        ≈ {(parseFloat(remittance.amount) * remittance.exchangeRate).toFixed(2)} {remittance.targetToken}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        remittance.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        remittance.status === 'completed' ? 'bg-green-100 text-green-800' :
                        remittance.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {remittance.status.charAt(0).toUpperCase() + remittance.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/remittances/${remittance.id}`} className="text-blue-600 hover:text-blue-900">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <i className="fas fa-paper-plane text-5xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No remittances found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You haven't sent any money yet." 
                : `You don't have any ${filter} remittances.`}
            </p>
            <Link 
              to="/send-money" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Send Your First Transfer
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Remittances;
