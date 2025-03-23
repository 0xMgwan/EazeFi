import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';

const SendMoney = () => {
  const { 
    balances, 
    getBalance, 
    createRemittance, 
    getExchangeRate,
    loading 
  } = useContext(WalletContext);
  
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    recipientPhone: '',
    recipientName: '',
    recipientCountry: '',
    amount: '',
    sourceToken: 'XLM',
    targetToken: 'USDC',
    insurance: false,
    notes: ''
  });
  const [exchangeRate, setExchangeRate] = useState(null);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    recipientPhone, 
    recipientName, 
    recipientCountry, 
    amount, 
    sourceToken, 
    targetToken, 
    insurance, 
    notes 
  } = formData;

  useEffect(() => {
    getBalance();
  }, []);

  useEffect(() => {
    if (amount && sourceToken && targetToken) {
      calculateExchangeRate();
    }
  }, [amount, sourceToken, targetToken]);

  const calculateExchangeRate = async () => {
    try {
      // Mock exchange rate calculation
      let mockRate;
      
      // Different rates based on the token pair
      if (sourceToken === 'XLM' && targetToken === 'USDC') {
        mockRate = {
          rate: 0.25 + (Math.random() * 0.02 - 0.01), // Around 0.25 USD per XLM
          sourceAmount: parseFloat(amount),
          targetAmount: parseFloat(amount) * 0.25
        };
      } else if (sourceToken === 'XLM' && targetToken === 'EURT') {
        mockRate = {
          rate: 0.23 + (Math.random() * 0.02 - 0.01), // Around 0.23 EUR per XLM
          sourceAmount: parseFloat(amount),
          targetAmount: parseFloat(amount) * 0.23
        };
      } else if (sourceToken === 'USDC' && targetToken === 'XLM') {
        mockRate = {
          rate: 4.0 + (Math.random() * 0.2 - 0.1), // Around 4 XLM per USDC
          sourceAmount: parseFloat(amount),
          targetAmount: parseFloat(amount) * 4.0
        };
      } else if (sourceToken === 'XLM' && targetToken === 'NGNT') {
        mockRate = {
          rate: 380 + (Math.random() * 10 - 5), // Around 380 NGN per XLM
          sourceAmount: parseFloat(amount),
          targetAmount: parseFloat(amount) * 380
        };
      } else if (sourceToken === 'XLM' && targetToken === 'KEST') {
        mockRate = {
          rate: 130 + (Math.random() * 5 - 2.5), // Around 130 KES per XLM
          sourceAmount: parseFloat(amount),
          targetAmount: parseFloat(amount) * 130
        };
      } else if (sourceToken === 'XLM' && targetToken === 'TSHT') {
        mockRate = {
          rate: 2500 + (Math.random() * 50 - 25), // Around 2500 TZS per XLM
          sourceAmount: parseFloat(amount),
          targetAmount: parseFloat(amount) * 2500
        };
      } else {
        // Default fallback
        mockRate = {
          rate: 1.0,
          sourceAmount: parseFloat(amount),
          targetAmount: parseFloat(amount)
        };
      }
      
      setExchangeRate(mockRate);
      
      // Calculate fee (0.5% of the amount)
      const fee = parseFloat(amount) * 0.005 || 0;
      setEstimatedFee(fee);
      
      // Calculate total amount (amount + fee + insurance if selected)
      let total = parseFloat(amount) + fee;
      if (insurance) {
        total += parseFloat(amount) * 0.01; // 1% insurance fee
      }
      setTotalAmount(total);
    } catch (err) {
      console.error('Error calculating exchange rate:', err);
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

  const validateStep1 = () => {
    const errors = {};
    
    if (!recipientPhone) {
      errors.recipientPhone = 'Phone number is required';
    }
    
    if (!recipientName) {
      errors.recipientName = 'Recipient name is required';
    }
    
    if (!recipientCountry) {
      errors.recipientCountry = 'Recipient country is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }
    
    // Check if user has sufficient balance
    if (balances && balances.length > 0) {
      const selectedBalance = balances.find(b => 
        (b.asset_type === 'native' && sourceToken === 'XLM') || 
        (b.asset_code === sourceToken)
      );
      
      if (selectedBalance && parseFloat(selectedBalance.balance) < totalAmount) {
        errors.amount = `Insufficient balance. You have ${parseFloat(selectedBalance.balance).toFixed(7)} ${sourceToken}`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      // Generate a random 6-digit redemption code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setRedemptionCode(code);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const remittanceData = {
        ...formData,
        exchangeRate: exchangeRate.rate,
        redemptionCode
      };
      
      const result = await createRemittance(remittanceData);
      
      if (result) {
        navigate('/remittances');
      }
    } catch (err) {
      console.error('Error creating remittance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // List of countries for dropdown
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
    'France', 'Spain', 'Italy', 'Japan', 'China', 'India', 'Brazil', 
    'Mexico', 'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Tanzania', 
    'Uganda', 'Rwanda', 'Ethiopia', 'Egypt', 'Morocco', 'UAE', 'Saudi Arabia'
  ];

  // Available tokens
  const availableTokens = [
    { code: 'XLM', name: 'Stellar Lumens' },
    { code: 'USDC', name: 'USD Coin' },
    { code: 'EURT', name: 'Euro Token' },
    { code: 'NGNT', name: 'Nigerian Naira Token' },
    { code: 'KEST', name: 'Kenyan Shilling Token' },
    { code: 'TSHT', name: 'Tanzanian Shilling Token' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Send Money</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-blue-500' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 3 ? 'bg-blue-500' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm font-medium text-gray-600">Recipient</span>
              <span className="text-sm font-medium text-gray-600">Amount</span>
              <span className="text-sm font-medium text-gray-600">Confirm</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recipient Information</h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientPhone">
                    Phone Number
                  </label>
                  <input
                    className={`shadow appearance-none border ${formErrors.recipientPhone ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                    id="recipientPhone"
                    type="tel"
                    placeholder="Recipient's phone number"
                    name="recipientPhone"
                    value={recipientPhone}
                    onChange={onChange}
                  />
                  {formErrors.recipientPhone && <p className="text-red-500 text-xs italic mt-1">{formErrors.recipientPhone}</p>}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientName">
                    Full Name
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
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientCountry">
                    Country
                  </label>
                  <select
                    className={`shadow appearance-none border ${formErrors.recipientCountry ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                    id="recipientCountry"
                    name="recipientCountry"
                    value={recipientCountry}
                    onChange={onChange}
                  >
                    <option value="">Select Country</option>
                    {countries.map((country, index) => (
                      <option key={index} value={country}>{country}</option>
                    ))}
                  </select>
                  {formErrors.recipientCountry && <p className="text-red-500 text-xs italic mt-1">{formErrors.recipientCountry}</p>}
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Next <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Amount & Currency</h2>
                
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
                      className="shadow appearance-none border border-l-0 border-gray-300 rounded-r py-2 px-3 bg-gray-100 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      name="sourceToken"
                      value={sourceToken}
                      onChange={onChange}
                    >
                      {availableTokens.map((token, index) => (
                        <option key={index} value={token.code}>{token.code}</option>
                      ))}
                    </select>
                  </div>
                  {formErrors.amount && <p className="text-red-500 text-xs italic mt-1">{formErrors.amount}</p>}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetToken">
                    Recipient Gets
                  </label>
                  <div className="flex items-center">
                    <div className="bg-gray-100 rounded-lg p-3 flex-1">
                      <div className="text-gray-500 text-sm">Estimated Amount</div>
                      <div className="text-xl font-semibold mt-1">
                        {exchangeRate ? (
                          `${(parseFloat(amount) * exchangeRate.rate).toFixed(2)} ${targetToken}`
                        ) : (
                          '0.00'
                        )}
                      </div>
                    </div>
                    <div className="ml-2">
                      <select
                        className="shadow appearance-none border border-gray-300 rounded py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-full"
                        name="targetToken"
                        value={targetToken}
                        onChange={onChange}
                      >
                        {availableTokens.map((token, index) => (
                          <option key={index} value={token.code}>{token.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      id="insurance"
                      type="checkbox"
                      name="insurance"
                      checked={insurance}
                      onChange={onChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="insurance" className="ml-2 block text-sm text-gray-700">
                      Add insurance (1% fee)
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Insurance protects your transfer against currency fluctuations and network issues.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="notes"
                    placeholder="Add a message to the recipient"
                    name="notes"
                    value={notes}
                    onChange={onChange}
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Transfer Summary</h3>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">{amount} {sourceToken}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Fee (0.5%)</span>
                    <span className="font-medium">{parseFloat(estimatedFee).toFixed(7)} {sourceToken}</span>
                  </div>
                  {insurance && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Insurance (1%)</span>
                      <span className="font-medium">{(parseFloat(amount) * 0.01).toFixed(7)} {sourceToken}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Exchange Rate</span>
                    <span className="font-medium">
                      {exchangeRate ? `1 ${sourceToken} = ${exchangeRate.rate.toFixed(7)} ${targetToken}` : `1 ${sourceToken} = 0.0000000 ${targetToken}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Total</span>
                    <span>{parseFloat(totalAmount).toFixed(7)} {sourceToken}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                  >
                    <i className="fas fa-arrow-left mr-2"></i> Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Next <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Transfer</h2>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> Share this redemption code with the recipient. They will need it to claim the funds.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Redemption Code</h3>
                  <div className="flex justify-between items-center">
                    <div className="bg-white p-3 rounded border border-gray-300 font-mono text-xl tracking-widest flex-1 text-center">
                      {redemptionCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(redemptionCode)}
                      className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded"
                      title="Copy to clipboard"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Transfer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Recipient</h4>
                      <p className="font-medium">{recipientName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                      <p className="font-medium">{recipientPhone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Country</h4>
                      <p className="font-medium">{recipientCountry}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Amount</h4>
                      <p className="font-medium">{amount} {sourceToken}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Recipient Gets</h4>
                      <p className="font-medium">
                        {exchangeRate ? (
                          `${(parseFloat(amount) * exchangeRate.rate).toFixed(2)} ${targetToken}`
                        ) : (
                          `0.00 ${targetToken}`
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Total Cost</h4>
                      <p className="font-medium">{parseFloat(totalAmount).toFixed(7)} {sourceToken}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                  >
                    <i className="fas fa-arrow-left mr-2"></i> Back
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span>Confirm & Send <i className="fas fa-paper-plane ml-2"></i></span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendMoney;
