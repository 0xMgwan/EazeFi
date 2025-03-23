import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';

const RemittanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRemittanceById, cancelRemittance, loading } = useContext(WalletContext);
  const [remittance, setRemittance] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRedemptionCode, setShowRedemptionCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRemittance = async () => {
      const data = await getRemittanceById(id);
      setRemittance(data);
    };

    fetchRemittance();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleCancelRemittance = async () => {
    setIsSubmitting(true);
    const success = await cancelRemittance(id);
    setIsSubmitting(false);
    
    if (success) {
      setShowCancelModal(false);
      // Refresh remittance data
      const data = await getRemittanceById(id);
      setRemittance(data);
    }
  };

  if (loading || !remittance) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/remittances" className="text-blue-500 hover:text-blue-700">
          <i className="fas fa-arrow-left mr-2"></i> Back to Remittances
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Remittance Details</h1>
          <p className="text-gray-600 mt-2">Transaction ID: {remittance.id.substring(0, 8)}...</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          {remittance.status === 'pending' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              <i className="fas fa-times mr-2"></i> Cancel Transfer
            </button>
          )}
          <button
            onClick={() => navigate('/send-money')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <i className="fas fa-paper-plane mr-2"></i> New Transfer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            remittance.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 
            remittance.status === 'completed' ? 'bg-green-100 text-green-600' :
            'bg-red-100 text-red-600'
          }`}>
            {remittance.status === 'pending' ? (
              <i className="fas fa-clock text-2xl"></i>
            ) : remittance.status === 'completed' ? (
              <i className="fas fa-check text-2xl"></i>
            ) : (
              <i className="fas fa-times text-2xl"></i>
            )}
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {remittance.status === 'pending' ? 'Pending Transfer' : 
               remittance.status === 'completed' ? 'Completed Transfer' :
               'Cancelled Transfer'}
            </h2>
            <p className="text-gray-600">
              {remittance.status === 'pending' ? 
                'This transfer is waiting to be claimed by the recipient.' : 
                remittance.status === 'completed' ? 
                'This transfer has been successfully claimed by the recipient.' :
                'This transfer has been cancelled.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{formatDate(remittance.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Sent</span>
                <span className="font-medium">{parseFloat(remittance.amount).toFixed(2)} {remittance.sourceToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient Gets</span>
                <span className="font-medium">
                  {(parseFloat(remittance.amount) * remittance.exchangeRate).toFixed(2)} {remittance.targetToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate</span>
                <span className="font-medium">
                  1 {remittance.sourceToken} = {remittance.exchangeRate.toFixed(7)} {remittance.targetToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee</span>
                <span className="font-medium">{(parseFloat(remittance.amount) * 0.005).toFixed(2)} {remittance.sourceToken}</span>
              </div>
              {remittance.insurance && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance</span>
                  <span className="font-medium">{(parseFloat(remittance.amount) * 0.01).toFixed(2)} {remittance.sourceToken}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cost</span>
                <span className="font-medium">
                  {(parseFloat(remittance.amount) + 
                    parseFloat(remittance.amount) * 0.005 + 
                    (remittance.insurance ? parseFloat(remittance.amount) * 0.01 : 0)).toFixed(2)} {remittance.sourceToken}
                </span>
              </div>
              {remittance.notes && (
                <div className="pt-2">
                  <span className="text-gray-600 block mb-1">Notes</span>
                  <p className="bg-gray-50 p-3 rounded text-gray-700">{remittance.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipient Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-medium">{remittance.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium">{remittance.recipientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country</span>
                <span className="font-medium">{remittance.recipientCountry}</span>
              </div>
              
              {remittance.status === 'pending' && (
                <div className="pt-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          The recipient will need the redemption code to claim this transfer.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => setShowRedemptionCode(!showRedemptionCode)}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
                    >
                      {showRedemptionCode ? 'Hide Redemption Code' : 'Show Redemption Code'}
                    </button>
                    
                    {showRedemptionCode && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center">
                          <div className="bg-white p-3 rounded border border-gray-300 font-mono text-xl tracking-widest flex-1 text-center">
                            {remittance.redemptionCode}
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(remittance.redemptionCode)}
                            className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded"
                            title="Copy to clipboard"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {remittance.status === 'completed' && remittance.completedAt && (
                <div className="pt-4">
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <i className="fas fa-check-circle text-green-400"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          This transfer was claimed on {formatDate(remittance.completedAt)}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {remittance.status === 'cancelled' && remittance.cancelledAt && (
                <div className="pt-4">
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <i className="fas fa-times-circle text-red-400"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          This transfer was cancelled on {formatDate(remittance.cancelledAt)}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
        <div className="space-y-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fas fa-paper-plane text-blue-600"></i>
              </div>
              <div className="h-full w-0.5 bg-gray-200 mx-auto mt-2"></div>
            </div>
            <div className="ml-4">
              <div className="font-medium">Transfer Created</div>
              <div className="text-sm text-gray-500">{formatDate(remittance.createdAt)}</div>
              <div className="text-sm text-gray-600 mt-1">
                You sent {parseFloat(remittance.amount).toFixed(2)} {remittance.sourceToken} to {remittance.recipientName}
              </div>
            </div>
          </div>

          {remittance.status === 'completed' && remittance.completedAt && (
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="fas fa-check text-green-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <div className="font-medium">Transfer Completed</div>
                <div className="text-sm text-gray-500">{formatDate(remittance.completedAt)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {remittance.recipientName} claimed the transfer using the redemption code
                </div>
              </div>
            </div>
          )}

          {remittance.status === 'cancelled' && remittance.cancelledAt && (
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <i className="fas fa-times text-red-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <div className="font-medium">Transfer Cancelled</div>
                <div className="text-sm text-gray-500">{formatDate(remittance.cancelledAt)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  The transfer was cancelled and funds were returned to your wallet
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Cancel Transfer</h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel this transfer? This action cannot be undone.
              </p>
              <p className="text-gray-700">
                The funds will be returned to your wallet minus any network fees.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg mr-2"
              >
                No, Keep Transfer
              </button>
              <button
                type="button"
                onClick={handleCancelRemittance}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  'Yes, Cancel Transfer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemittanceDetails;
