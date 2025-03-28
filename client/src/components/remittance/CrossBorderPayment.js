import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';
import AuthContext from '../../context/AuthContext';
import { 
  getCrossBorderInfo, 
  initiateCrossBorderPayment, 
  getCrossBorderTransaction,
  getCustomerInfo,
  updateCustomerInfo
} from '../../utils/sepUtils';

const CrossBorderPayment = () => {
  const { balances, getBalance } = useContext(WalletContext);
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [assetCode, setAssetCode] = useState('TSHT');
  const [amount, setAmount] = useState('');
  const [receiverInfo, setReceiverInfo] = useState({
    receiver_phone_number: '',
    receiver_name: '',
    receiver_bank_account: '',
    receiver_bank_code: '',
    purpose_code: 'FAMILY_SUPPORT'
  });
  const [crossBorderInfo, setCrossBorderInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('send');
  
  // Available regulated tokens
  const regulatedTokens = [
    { code: 'TSHT', name: 'Tanzanian Shilling Token' },
    { code: 'NGNT', name: 'Nigerian Naira Token' },
    { code: 'KEST', name: 'Kenyan Shilling Token' }
  ];
  
  // Purpose codes
  const purposeCodes = [
    { code: 'FAMILY_SUPPORT', name: 'Family Support' },
    { code: 'EDUCATION', name: 'Education' },
    { code: 'BUSINESS', name: 'Business' },
    { code: 'OTHER', name: 'Other' }
  ];
  
  useEffect(() => {
    const fetchCrossBorderInfo = async () => {
      try {
        setLoading(true);
        const info = await getCrossBorderInfo(token);
        setCrossBorderInfo(info);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cross-border info:', err);
        setError('Failed to fetch cross-border payment information');
        setLoading(false);
      }
    };
    
    if (token) {
      fetchCrossBorderInfo();
    }
    
    // Refresh balances
    getBalance();
  }, [token, getBalance]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceiverInfo({
      ...receiverInfo,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
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
      
      // Create sender and receiver IDs
      const senderId = user.id;
      const receiverId = `receiver-${Date.now()}`;
      
      // Update receiver information
      await updateCustomerInfo(token, receiverId, {
        first_name: receiverInfo.receiver_name.split(' ')[0],
        last_name: receiverInfo.receiver_name.split(' ').slice(1).join(' '),
        phone_number: receiverInfo.receiver_phone_number
      });
      
      // Prepare transaction fields based on asset type
      let fields = {
        transaction: {
          receiver_name: receiverInfo.receiver_name,
          purpose_code: receiverInfo.purpose_code
        }
      };
      
      if (assetCode === 'TSHT' || assetCode === 'KEST') {
        fields.transaction.receiver_phone_number = receiverInfo.receiver_phone_number;
      } else if (assetCode === 'NGNT') {
        fields.transaction.receiver_bank_account = receiverInfo.receiver_bank_account;
        fields.transaction.receiver_bank_code = receiverInfo.receiver_bank_code;
      }
      
      // Initiate cross-border payment
      const result = await initiateCrossBorderPayment(token, {
        amount,
        asset_code: assetCode,
        asset_issuer: 'GCXMWUAUF37IWOOV2FRDKWEX3O2IHLM2FYH4WPI4PYUKAIFQEUU5X3TD',
        sender_id: senderId,
        receiver_id: receiverId,
        fields
      });
      
      setSuccess(`Cross-border payment initiated successfully. Transaction ID: ${result.id}`);
      
      // Reset form
      setAmount('');
      setReceiverInfo({
        receiver_phone_number: '',
        receiver_name: '',
        receiver_bank_account: '',
        receiver_bank_code: '',
        purpose_code: 'FAMILY_SUPPORT'
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error initiating cross-border payment:', err);
      setError(err.response?.data?.error || 'Failed to initiate cross-border payment');
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading && !crossBorderInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Cross-Border Payments</h1>
        
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
                activeTab === 'send' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('send')}
            >
              Send Payment
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
            {activeTab === 'send' && (
              <form onSubmit={handleSubmit}>
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
                
                <div className="mb-4">
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
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="receiver_name">
                    Receiver Name
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="receiver_name"
                    name="receiver_name"
                    type="text"
                    placeholder="Full Name"
                    value={receiverInfo.receiver_name}
                    onChange={handleInputChange}
                  />
                </div>
                
                {(assetCode === 'TSHT' || assetCode === 'KEST') && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="receiver_phone_number">
                      Receiver Phone Number
                    </label>
                    <input
                      className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="receiver_phone_number"
                      name="receiver_phone_number"
                      type="text"
                      placeholder="+255 123 456 789"
                      value={receiverInfo.receiver_phone_number}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
                
                {assetCode === 'NGNT' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="receiver_bank_account">
                        Receiver Bank Account
                      </label>
                      <input
                        className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="receiver_bank_account"
                        name="receiver_bank_account"
                        type="text"
                        placeholder="Bank Account Number"
                        value={receiverInfo.receiver_bank_account}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="receiver_bank_code">
                        Receiver Bank Code
                      </label>
                      <input
                        className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="receiver_bank_code"
                        name="receiver_bank_code"
                        type="text"
                        placeholder="Bank Code"
                        value={receiverInfo.receiver_bank_code}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purpose_code">
                    Purpose of Payment
                  </label>
                  <select
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="purpose_code"
                    name="purpose_code"
                    value={receiverInfo.purpose_code}
                    onChange={handleInputChange}
                  >
                    {purposeCodes.map((purpose) => (
                      <option key={purpose.code} value={purpose.code}>
                        {purpose.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Send Payment'}
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
                            Asset
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receiver
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
                              {tx.amount_in_asset}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {tx.amount_in}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {tx.receiver_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                tx.status.includes('pending') ? 'bg-yellow-100 text-yellow-800' : 
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

export default CrossBorderPayment;
