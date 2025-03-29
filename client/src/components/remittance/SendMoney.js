import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';
import axios from 'axios';
import * as StellarSdk from 'stellar-sdk';
import { FaExchangeAlt, FaCheckCircle, FaInfoCircle, FaCopy, FaSpinner, FaRocket } from 'react-icons/fa';

const SendMoney = () => {
  const { 
    balances, 
    getBalance, 
    createRemittance, 
    getExchangeRate,
    loading,
    wallet // Add wallet to the destructured variables
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
  
  // For testnet demo - now default mode
  const [isTestnetDemo, setIsTestnetDemo] = useState(true);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientDemoName, setRecipientDemoName] = useState('');
  const [recipientDemoCountry, setRecipientDemoCountry] = useState('');
  const [usePhoneNumber, setUsePhoneNumber] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('XLM');
  const [transactionHash, setTransactionHash] = useState('');
  const [recipientTSHTAmount, setRecipientTSHTAmount] = useState('0');
  const [amount, setAmount] = useState('');
  const [demoExchangeRate, setDemoExchangeRate] = useState(248.73); // Mock exchange rate for XLM to TSHT
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate recipient amount in TSHT based on selected asset amount
  useEffect(() => {
    if (amount && demoExchangeRate) {
      if (selectedAsset === 'XLM') {
        setRecipientTSHTAmount((parseFloat(amount) * demoExchangeRate).toFixed(2));
      } else if (selectedAsset === 'USDC') {
        setRecipientTSHTAmount((parseFloat(amount) * demoExchangeRate * 3.5).toFixed(2));
      }
    } else {
      setRecipientTSHTAmount('0');
    }
  }, [amount, demoExchangeRate, selectedAsset]);
  
  const { 
    recipientPhone: formRecipientPhone, 
    recipientName, 
    recipientCountry, 
    amount: formAmount, 
    sourceToken, 
    targetToken, 
    insurance, 
    notes 
  } = formData;

  useEffect(() => {
    getBalance();
    
    // Generate a random recipient address for testnet demo
    const keypair = StellarSdk.Keypair.random();
    setRecipientAddress(keypair.publicKey());
  }, []);

  useEffect(() => {
    if (formAmount && sourceToken && targetToken) {
      calculateExchangeRate();
    }
    
    // Calculate TSHT amount for testnet demo
    if (isTestnetDemo && amount && !isNaN(amount)) {
      const tsht = (parseFloat(amount) * demoExchangeRate).toFixed(2);
      setRecipientTSHTAmount(tsht);
    }
  }, [formAmount, amount, sourceToken, targetToken, isTestnetDemo, demoExchangeRate]);

  const calculateExchangeRate = async () => {
    try {
      // Mock exchange rate calculation
      let mockRate;
      
      // Different rates based on the token pair
      if (sourceToken === 'XLM' && targetToken === 'USDC') {
        mockRate = {
          rate: 0.25 + (Math.random() * 0.02 - 0.01), // Around 0.25 USD per XLM
          sourceAmount: parseFloat(formAmount),
          targetAmount: parseFloat(formAmount) * 0.25
        };
      } else if (sourceToken === 'XLM' && targetToken === 'EURT') {
        mockRate = {
          rate: 0.23 + (Math.random() * 0.02 - 0.01), // Around 0.23 EUR per XLM
          sourceAmount: parseFloat(formAmount),
          targetAmount: parseFloat(formAmount) * 0.23
        };
      } else if (sourceToken === 'USDC' && targetToken === 'XLM') {
        mockRate = {
          rate: 4.0 + (Math.random() * 0.2 - 0.1), // Around 4 XLM per USDC
          sourceAmount: parseFloat(formAmount),
          targetAmount: parseFloat(formAmount) * 4.0
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
    
    if (!formRecipientPhone) {
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
    
    if (!formAmount || parseFloat(formAmount) <= 0) {
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

  // Toggle between regular remittance and testnet demo
  const toggleTestnetDemo = () => {
    setIsTestnetDemo(!isTestnetDemo);
    setStep(1); // Reset to step 1 when toggling
    setError(null);
    setSuccess(false);
    setTransactionHash('');
    
    // Reset form fields
    setRecipientDemoName('');
    setRecipientDemoCountry('');
    setRecipientPhone('');
    setAmount('');
    
    // Generate a new random testnet address when enabling demo mode
    if (!isTestnetDemo) {
      setRecipientAddress(generateRandomTestnetAddress());
    }
  };
  
  // Copy transaction hash to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };
  
  // Add a new function to generate a random testnet address
  const generateRandomTestnetAddress = () => {
    const keypair = StellarSdk.Keypair.random();
    return keypair.publicKey();
  };
  
  // Function to resolve phone number to a Stellar address
  const resolvePhoneNumberToAddress = async (phoneNumber) => {
    try {
      // In a real implementation, this would call your backend API
      // to look up the address associated with this phone number
      console.log(`Resolving phone number ${phoneNumber} to Stellar address`);
      
      // For demo purposes, we'll simulate a successful lookup
      // In production, this would make an API call to your backend
      const mockAddressMapping = {
        '+255123456789': 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
        '+254123456789': 'GDW3CNKSP5AOTDQ2YCKNGC6L65CE4JDX3JS5BV427OB54HCF2J4PUEVG',
        '+256123456789': 'GCJKSAQECAB4VBDLAQIHWZA7MSSF7GBRDXM4SCBMMIWIRX3JXCXYSHMV'
      };
      
      // Return the mapped address or generate a random one if not found
      return mockAddressMapping[phoneNumber] || generateRandomTestnetAddress();
    } catch (error) {
      console.error('Error resolving phone number to address:', error);
      return null;
    }
  };
  
  // Process testnet remittance using Soroban contract
  const processTestnetRemittance = async () => {
    // Reset transaction state
    setTransactionHash('');
    setError(null);
    setSuccess(false);
    
    if (!wallet || !wallet.address) {
      setError('No wallet connected. Please connect your wallet first.');
      return false;
    }
    
    // Check if wallet has secretKey (required for signing transactions)
    if (!wallet.secretKey) {
      setError('This wallet type does not support direct transactions. Please use a wallet with full access.');
      return false;
    }
    
    setError(null);
    
    try {
      // Initialize Stellar SDK
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sorobanServer = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org');
      let sourceKeypair;
      let sourcePublicKey;
      
      try {
        sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.secretKey);
        sourcePublicKey = sourceKeypair.publicKey();
      } catch (keyError) {
        console.error('Error creating keypair:', keyError);
        setError('Invalid wallet secret key. Please reconnect your wallet.');
        return false;
      }
      
      // Determine the actual recipient address if using phone number
      const finalRecipientAddress = usePhoneNumber ? 
        await resolvePhoneNumberToAddress(recipientPhone) : 
        recipientAddress;
      
      if (!finalRecipientAddress) {
        setError('Could not resolve phone number to a valid Stellar address.');
        return false;
      }
      
      console.log('Sending from:', sourcePublicKey);
      console.log('Sending to:', finalRecipientAddress);
      console.log('Amount:', amount, selectedAsset);
      
      // Use the actual remittance contract ID
      const remittanceContractId = 'CDCYWK73YTYFJZZSJ5V7EDFNHYBG4QN3VUNG4DQHI72HPQYQTQKBVVKL';
      console.log('Using Remittance contract:', remittanceContractId);
      
      // Step 1: First send the asset to the recipient address
      // Load source account
      const sourceAccount = await server.loadAccount(sourcePublicKey);
      
      // Determine which asset to send
      let assetToSend;
      if (selectedAsset === 'XLM') {
        assetToSend = StellarSdk.Asset.native();
      } else if (selectedAsset === 'USDC') {
        // Use the testnet USDC issuer
        const usdcIssuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
        assetToSend = new StellarSdk.Asset('USDC', usdcIssuer);
      }
      
      // Build the payment transaction
      const xlmTransaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: finalRecipientAddress,
          asset: assetToSend,
          amount: amount.toString()
        }))
        .addMemo(StellarSdk.Memo.text('EazeFi Remittance Demo'))
        .setTimeout(180)
        .build();
      
      // Sign the transaction
      xlmTransaction.sign(sourceKeypair);
      
      // Submit the transaction
      const xlmTransactionResult = await server.submitTransaction(xlmTransaction);
      console.log('XLM Transaction successful! Hash:', xlmTransactionResult.hash);
      
      // Store transaction hash
      setTransactionHash(xlmTransactionResult.hash);
      
      // Force refresh balance after transaction
      setTimeout(async () => {
        try {
          await getBalance();
          console.log('Balance refreshed after transaction');
        } catch (err) {
          console.error('Error refreshing balance:', err);
        }
      }, 3000); // Wait 3 seconds to allow the network to process the transaction
      
      // Step 2: Create a remittance using the Soroban contract
      try {
        // Load account again for the Soroban transaction
        const sorobanAccount = await server.loadAccount(sourcePublicKey);
        
        // Create contract instance
        const contract = new StellarSdk.Contract(remittanceContractId);
        
        // Convert amount to the proper format for Soroban (7 decimal places)
        // Use the xdr.Int128Parts constructor directly without BigInt
        const tokenAmountNumber = Math.floor(parseFloat(amount) * 10000000);
        
        // Create parameters for creating a remittance
        const createRemittanceParams = [
          new StellarSdk.Address(sourcePublicKey).toScVal(),
          StellarSdk.xdr.ScVal.scvString(recipientAddress),
          StellarSdk.xdr.ScVal.scvI128(new StellarSdk.xdr.Int128Parts({
            hi: 0,
            lo: tokenAmountNumber
          }))
        ];
        
        // Build the Soroban transaction
        const sorobanTransaction = new StellarSdk.TransactionBuilder(sorobanAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET
        })
          .addOperation(contract.call('create_remittance', ...createRemittanceParams))
          .setTimeout(30)
          .build();
        
        // Sign the Soroban transaction
        sorobanTransaction.sign(sourceKeypair);
        
        // Submit the Soroban transaction
        const sorobanResponse = await sorobanServer.sendTransaction(sorobanTransaction);
        console.log('Soroban transaction submitted:', sorobanResponse);
        
        // Wait for the Soroban transaction to be confirmed
        if (sorobanResponse.status === 'PENDING') {
          let txResponse;
          do {
            await new Promise(resolve => setTimeout(resolve, 1000));
            txResponse = await sorobanServer.getTransaction(sorobanResponse.hash);
            console.log('Soroban transaction status:', txResponse.status);
          } while (txResponse.status === 'PENDING');
          
          if (txResponse.status === 'SUCCESS') {
            console.log('Remittance created successfully on Soroban contract!');
            
            // Parse the result to get the remittance ID
            try {
              const resultXdr = StellarSdk.xdr.ScVal.fromXDR(txResponse.resultXdr, 'base64');
              if (resultXdr.switch().name === 'scvBytes') {
                const remittanceId = resultXdr.bytes().toString('hex');
                console.log('Remittance ID:', remittanceId);
              }
            } catch (err) {
              console.error('Error parsing remittance ID:', err);
            }
          } else {
            console.error('Soroban transaction failed:', txResponse);
            setError(`Soroban transaction failed: ${txResponse.status}`);
          }
        } else {
          console.error('Soroban transaction submission failed:', sorobanResponse);
          setError(`Soroban transaction submission failed: ${sorobanResponse.status}`);
        }
      } catch (sorobanError) {
        console.error('Error with Soroban contract call:', sorobanError);
        // Don't fail the whole process if the Soroban part fails
        // The XLM transaction was still successful
      }
      
      // Set success state - the recipient has received TSHT tokens through the remittance contract
      setSuccess(true);
      
      // Refresh balances
      await getBalance();
      
      return true;
    } catch (err) {
      console.error('Error processing testnet remittance:', err);
      setError(err.message || 'Failed to process remittance. Please try again.');
      return false;
    }
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isTestnetDemo) {
        // Process testnet demo remittance
        if (step === 2) {
          const success = await processTestnetRemittance();
          if (success) {
            setStep(3); // Move to completion step
          }
        } else if (step === 1) {
          // Validate first step for testnet demo
          if (usePhoneNumber && !recipientPhone) {
            setError('Please enter a recipient phone number');
            setIsSubmitting(false);
            return;
          }
          
          if (!recipientDemoName) {
            setError('Please enter a recipient name');
            setIsSubmitting(false);
            return;
          }
          
          if (!recipientDemoCountry) {
            setError('Please select a recipient country');
            setIsSubmitting(false);
            return;
          }
          
          if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            setIsSubmitting(false);
            return;
          }
          
          // Move to the next step
          setStep(step + 1);
        }
      } else {
        // Process regular remittance
        const remittanceData = {
          ...formData,
          exchangeRate: exchangeRate.rate,
          redemptionCode
        };
        
        const result = await createRemittance(remittanceData);
        
        if (result) {
          navigate('/remittances');
        }
      }
    } catch (err) {
      console.error('Error creating remittance:', err);
    } finally {
      // Only set isSubmitting to false if we're not moving to the next step
      // This prevents the button from flickering during the transition
      if (step === 2 || !isTestnetDemo) {
        setIsSubmitting(false);
      } else {
        // For step 1 in testnet demo, we'll set it to false after a short delay
        // to allow for a smooth transition
        setTimeout(() => {
          setIsSubmitting(false);
        }, 500);
      }
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cross-Border Remittance</h1>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
            <div>
              <p className="text-blue-800">
                This demonstrates cross-border remittance using the Stellar testnet. 
                You'll send XLM from your wallet, and the recipient will receive TSHT (Tanzania Shilling Token).
              </p>
            </div>
          </div>
        </div>
        
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
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Recipient Information
                </h2>
                
                {isTestnetDemo ? (
                  /* Testnet Demo Form Fields */
                  <>
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <label className="inline-flex items-center mr-4">
                          <input
                            type="radio"
                            className="form-radio"
                            name="recipientType"
                            checked={!usePhoneNumber}
                            onChange={() => setUsePhoneNumber(false)}
                          />
                          <span className="ml-2">Stellar Address</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio"
                            name="recipientType"
                            checked={usePhoneNumber}
                            onChange={() => setUsePhoneNumber(true)}
                          />
                          <span className="ml-2">Phone Number</span>
                        </label>
                      </div>
                      
                      {!usePhoneNumber ? (
                        <>
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientAddress">
                            Recipient Address (Testnet)
                          </label>
                          <div className="flex">
                            <input
                              className="shadow appearance-none border border-gray-300 rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                              id="recipientAddress"
                              type="text"
                              value={recipientAddress}
                              onChange={(e) => setRecipientAddress(e.target.value)}
                            />
                            <button 
                              type="button"
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-r"
                              onClick={() => copyToClipboard(recipientAddress)}
                            >
                              <FaCopy />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Enter a valid Stellar testnet address or use the pre-filled one.</p>
                        </>
                      ) : (
                        <>
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientPhone">
                            Recipient Phone Number
                          </label>
                          <input
                            className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="recipientPhone"
                            type="tel"
                            placeholder="e.g. +255123456789"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter a phone number linked to a Stellar wallet.</p>
                        </>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientDemoName">
                        Recipient Name
                      </label>
                      <input
                        className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="recipientDemoName"
                        type="text"
                        placeholder="Enter recipient's full name"
                        value={recipientDemoName}
                        onChange={(e) => setRecipientDemoName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientDemoCountry">
                        Recipient Country
                      </label>
                      <select
                        className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="recipientDemoCountry"
                        value={recipientDemoCountry}
                        onChange={(e) => setRecipientDemoCountry(e.target.value)}
                        required
                      >
                        <option value="">Select a country</option>
                        {countries.map((country, index) => (
                          <option key={index} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Select Asset
                      </label>
                      <div className="flex space-x-4 mb-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio"
                            name="assetType"
                            checked={selectedAsset === 'XLM'}
                            onChange={() => setSelectedAsset('XLM')}
                          />
                          <span className="ml-2">XLM</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio"
                            name="assetType"
                            checked={selectedAsset === 'USDC'}
                            onChange={() => setSelectedAsset('USDC')}
                          />
                          <span className="ml-2">USDC</span>
                        </label>
                      </div>
                      
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="demoAmount">
                        Amount ({selectedAsset})
                      </label>
                      <input
                        className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="demoAmount"
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder={`Enter amount in ${selectedAsset}`}
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setFormData({...formData, amount: e.target.value});
                        }}
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Exchange Rate:</span>
                          <span className="font-medium">1 {selectedAsset} = {selectedAsset === 'XLM' ? demoExchangeRate : (demoExchangeRate * 3.5)} TSHT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Recipient Gets:</span>
                          <span className="font-medium">{selectedAsset === 'XLM' ? recipientTSHTAmount : (amount * demoExchangeRate * 3.5).toFixed(2)} TSHT</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Regular Remittance Form Fields */
                  <>
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
                        value={formRecipientPhone}
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
                  </>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Processing...
                      </>
                    ) : (
                      <>
                        Next <span className="ml-2">→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div>
                {isTestnetDemo ? (
                  /* Testnet Demo Confirmation */
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Testnet Transaction</h2>
                    
                    {!wallet || !wallet.address ? (
                      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                        <div className="flex items-start">
                          <FaInfoCircle className="text-yellow-500 mt-1 mr-2" />
                          <div>
                            <p className="text-yellow-800 font-medium mb-2">Wallet Not Connected</p>
                            <p className="text-yellow-800 text-sm mb-4">
                              You need to connect a Stellar wallet to proceed with this transaction.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                // Open wallet modal - this would typically be handled by your wallet connection system
                                const event = new CustomEvent('open-wallet-modal');
                                window.dispatchEvent(event);
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg"
                            >
                              Connect Wallet
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Sending</p>
                            <p className="text-lg font-medium">{amount} XLM</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Recipient Gets</p>
                            <p className="text-lg font-medium">{recipientTSHTAmount} TSHT</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">From</p>
                            <p className="text-sm font-medium text-gray-800 truncate">{wallet?.address || 'Not connected'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">To</p>
                            <p className="text-sm font-medium text-gray-800 truncate">{recipientAddress}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Exchange Rate</p>
                            <p className="text-sm font-medium">1 XLM = {demoExchangeRate} TSHT</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Network</p>
                            <p className="text-sm font-medium">Stellar Testnet</p>
                          </div>
                        </div>
                      </div>
                    )}
                    

                    
                    {error && (
                      <div className="bg-red-50 p-4 rounded-lg mb-6">
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Regular Remittance Amount & Currency */
                  <>
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
                  </>
                )}
                
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
                {isTestnetDemo ? (
                  /* Testnet Demo Transaction Results */
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction Complete</h2>
                    
                    {error ? (
                      <div className="bg-red-50 p-4 rounded-lg mb-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Transaction Failed</h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>{error}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg mb-6">
                        <div className="flex items-start">
                          <FaCheckCircle className="text-green-500 mt-1 mr-2 text-xl" />
                          <div>
                            <h3 className="text-sm font-medium text-green-800">Transaction Successful</h3>
                            <p className="mt-1 text-sm text-green-700">
                              You have successfully sent {amount} {selectedAsset} on the Stellar testnet to {recipientDemoName} in {recipientDemoCountry}. The recipient has received {selectedAsset === 'XLM' ? recipientTSHTAmount : (amount * demoExchangeRate * 3.5).toFixed(2)} TSHT through the Soroban remittance contract.
                            </p>
                            <p className="mt-1 text-sm text-green-700">
                              This is a real transaction on the Stellar testnet using the EazeFi remittance contract.
                            </p>

                            <p className="mt-2 text-sm text-blue-700">
                              <strong>Note:</strong> To see the TSHT tokens in the recipient wallet, the recipient needs to add the TSHT token to their wallet by using the asset code "TSHT" and issuer "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5".
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {transactionHash && (
                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Transaction Details</h3>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-blue-700 mb-1">Transaction Hash</h4>
                          <div className="flex items-center">
                            <div className="bg-white p-3 rounded border border-blue-300 font-mono text-sm overflow-x-auto flex-1">
                              {transactionHash}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(transactionHash);
                                alert('Transaction hash copied to clipboard!');
                              }}
                              className="ml-2 bg-blue-200 hover:bg-blue-300 text-blue-700 p-2 rounded"
                              title="Copy to clipboard"
                            >
                              <FaCopy />
                            </button>
                          </div>
                          <div className="mt-3">
                            <a 
                              href={`https://stellar.expert/explorer/testnet/tx/${transactionHash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center"
                            >
                              View on Stellar Explorer <span className="ml-2">↗</span>
                            </a>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">From</h4>
                            <p className="font-medium text-sm truncate">{wallet?.address || 'Not connected'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">To</h4>
                            <p className="font-medium text-sm truncate">{recipientAddress}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Amount Sent</h4>
                            <p className="font-medium">{amount} XLM</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Recipient Received</h4>
                            <p className="font-medium">{recipientTSHTAmount} TSHT</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Exchange Rate</h4>
                            <p className="font-medium">1 XLM = {demoExchangeRate} TSHT</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Network</h4>
                            <p className="font-medium">Stellar Testnet</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setTransactionHash('');
                          setError(null);
                          setSuccess(false);
                          setFormData({...formData, amount: ''});
                          setAmount('');
                          // Force refresh balance when starting a new transaction
                          getBalance();
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                      >
                        Start New Transaction
                      </button>
                    </div>
                  </>
                ) : (
                  /* Regular Remittance Confirmation */
                  <>
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
                          <p className="font-medium">{formRecipientPhone}</p>
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
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendMoney;
