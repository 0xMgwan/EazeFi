import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';

const MpesaRemittance = () => {
  const { 
    balances, 
    getBalance, 
    sendCryptoToMpesa,
    loading 
  } = useContext(WalletContext);
  
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    recipientPhone: '',
    recipientName: '',
    amount: '',
    sourceCurrency: 'XLM',
    insurance: false,
    notes: ''
  });
  
  const [tzsAmount, setTzsAmount] = useState(0);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  
  const { 
    recipientPhone, 
    recipientName, 
    amount, 
    sourceCurrency, 
    insurance, 
    notes 
  } = formData;

  useEffect(() => {
    getBalance();
  }, []);

  useEffect(() => {
    if (amount && sourceCurrency) {
      calculateTzsAmount();
    }
  }, [amount, sourceCurrency]);

  const calculateTzsAmount = async () => {
    try {
      // Mock TZS conversion (in production, this would call an API)
      let mockTzsRate;
      
      if (sourceCurrency === 'XLM') {
        // Approx 2500 TZS per XLM
        mockTzsRate = 2500 + (Math.random() * 100 - 50);
      } else if (sourceCurrency === 'USDC') {
        // Approx 2300 TZS per USD
        mockTzsRate = 2300 + (Math.random() * 100 - 50);
      } else {
        mockTzsRate = 1;
      }
      
      const convertedAmount = parseFloat(amount) * mockTzsRate;
      setTzsAmount(convertedAmount.toFixed(0));
      
      // Calculate fee (0.5% of the amount)
      const fee = parseFloat(amount) * 0.005;
      setEstimatedFee(fee.toFixed(6));
      
      // Calculate total amount (amount + fee + insurance if selected)
      let total = parseFloat(amount) + fee;
      if (insurance) {
        total += parseFloat(amount) * 0.01; // 1% insurance fee
      }
      setTotalAmount(total.toFixed(6));
    } catch (err) {
      console.error('Error calculating TZS amount:', err);
    }
  };

  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!recipientPhone) {
      errors.recipientPhone = 'Phone number is required';
    } else if (!recipientPhone.match(/^(0|\+?255)[0-9]{9}$/)) {
      errors.recipientPhone = 'Invalid Tanzania phone number format. Use +255XXXXXXXXX or 0XXXXXXXXX';
    }
    
    if (!recipientName) {
      errors.recipientName = 'Recipient name is required';
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }
    
    // Check if user has sufficient balance
    if (balances && balances.length > 0) {
      const selectedBalance = balances.find(b => b.asset === sourceCurrency);
      
      if (selectedBalance && parseFloat(selectedBalance.amount) < totalAmount) {
        errors.amount = `Insufficient balance. You have ${parseFloat(selectedBalance.amount).toFixed(7)} ${sourceCurrency}`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage({ type: '', message: '' });
    
    try {
      const mpesaData = {
        ...formData,
        targetAmount: tzsAmount
      };
      
      const result = await sendCryptoToMpesa(mpesaData);
      
      if (result && result.success) {
        setStatusMessage({ 
          type: 'success', 
          message: `Successfully sent ${amount} ${sourceCurrency} to ${recipientName} via M-Pesa. They will receive ${tzsAmount} TZS.` 
        });
        
        // Reset form
        setFormData({
          recipientPhone: '',
          recipientName: '',
          amount: '',
          sourceCurrency: 'XLM',
          insurance: false,
          notes: ''
        });
        
        // Navigate to remittances list after 3 seconds
        setTimeout(() => {
          navigate('/remittances');
        }, 3000);
      } else {
        setStatusMessage({ 
          type: 'error', 
          message: result?.error || 'Failed to send crypto to M-Pesa. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Error sending crypto to M-Pesa:', err);
      setStatusMessage({ 
        type: 'error', 
        message: err.message || 'Error sending crypto to M-Pesa' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Send Crypto to M-Pesa (Tanzania)</h1>
        
        {statusMessage.message && (
          <div className={`mb-6 p-4 rounded ${
            statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {statusMessage.message}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientPhone">
                Phone Number (Tanzania)
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.recipientPhone ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="recipientPhone"
                type="tel"
                placeholder="e.g., +255712345678 or 0712345678"
                name="recipientPhone"
                value={recipientPhone}
                onChange={onChange}
              />
              {formErrors.recipientPhone && <p className="text-red-500 text-xs italic mt-1">{formErrors.recipientPhone}</p>}
              <p className="text-xs text-gray-500 mt-1">Format: +255XXXXXXXXX or 0XXXXXXXXX</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientName">
                Recipient's Full Name
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.recipientName ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="recipientName"
                type="text"
                placeholder="Recipient's full name"
                name="recipientName"
                value={recipientName}
                onChange={onChange}
              />
              {formErrors.recipientName && <p className="text-red-500 text-xs italic mt-1">{formErrors.recipientName}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                Amount
              </label>
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${formErrors.amount ? 'border-red-500' : 'border-gray-300'} rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  id="amount"
                  type="number"
                  step="0.0000001"
                  placeholder="Enter amount"
                  name="amount"
                  value={amount}
                  onChange={onChange}
                />
                <select
                  className="shadow border border-gray-300 rounded-r py-2 px-3 bg-gray-100 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  name="sourceCurrency"
                  value={sourceCurrency}
                  onChange={onChange}
                >
                  <option value="XLM">XLM</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              {formErrors.amount && <p className="text-red-500 text-xs italic mt-1">{formErrors.amount}</p>}
            </div>
            
            {tzsAmount > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">Transaction Summary</h3>
                <p className="text-blue-800">Recipient will receive: <span className="font-bold">{tzsAmount} TZS</span></p>
                <p className="text-blue-800 text-sm">Exchange rate: 1 {sourceCurrency} = {(tzsAmount / parseFloat(amount || 1)).toFixed(2)} TZS</p>
                <p className="text-blue-800 text-sm">Transaction fee: {estimatedFee} {sourceCurrency}</p>
                {insurance && <p className="text-blue-800 text-sm">Insurance fee: {(parseFloat(amount) * 0.01).toFixed(6)} {sourceCurrency}</p>}
                <p className="text-blue-800 mt-2">Total amount: <span className="font-bold">{totalAmount} {sourceCurrency}</span></p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="insurance"
                  checked={insurance}
                  onChange={onChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Add transaction insurance (+1%)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Insurance protects against network failures and ensures your recipient gets the funds.</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                Notes (Optional)
              </label>
              <textarea
                className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="notes"
                placeholder="Add a note to the recipient"
                name="notes"
                value={notes}
                onChange={onChange}
                rows="3"
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className={`${
                  isSubmitting || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                } text-white font-semibold py-2 px-6 rounded-lg`}
              >
                {isSubmitting || loading ? 'Processing...' : 'Send to M-Pesa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MpesaRemittance;
