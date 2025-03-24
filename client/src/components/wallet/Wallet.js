import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';
import { FaWallet, FaExchangeAlt, FaArrowRight, FaPlus, FaArrowUp, FaArrowDown, FaCopy, FaPaperPlane, FaHistory, FaChartLine, FaQrcode, FaShieldAlt, FaEye, FaEyeSlash, FaFingerprint, FaRocket } from 'react-icons/fa';
import { BiTransfer, BiRefresh, BiLock, BiChip } from 'react-icons/bi';
import ConnectWalletModal from './ConnectWalletModal';

const Wallet = () => {
  const { 
    wallet, 
    balances, 
    transactions, 
    getWallet, 
    getBalance, 
    getTransactions,
    fundWallet,
    withdrawFromWallet,
    setWallet,
    loading 
  } = useContext(WalletContext);
  
  const [activeTab, setActiveTab] = useState('balances');
  const [fundModal, setFundModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [connectWalletModal, setConnectWalletModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [fundData, setFundData] = useState({
    amount: '',
    asset: 'XLM'
  });
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    asset: 'XLM',
    destination: ''
  });

  // Mock data for testing
  const mockWallet = {
    address: 'GBZH7S5NC57XNHKHJ75C5DGMI3SP6ZFJLIKW74K6OSMA5ELU6XPSLPQX',
    seed: 'SBQPDFUGLMWJYEYXFRM5TQX3AX2BR47WKI4FDS7EJQUSEUUVY72MZPJF',
    name: 'Demo Wallet'
  };

  const mockBalances = [
    { asset_code: 'XLM', balance: '1250.50', asset_type: 'native' },
    { asset_code: 'USDC', balance: '500.00', asset_type: 'credit_alphanum4' },
    { asset_code: 'BTC', balance: '0.025', asset_type: 'credit_alphanum4' }
  ];

  const mockTransactions = [
    { id: '1', type: 'payment', amount: '50.00', asset: 'XLM', date: '2025-03-20T10:30:00Z', from: 'GBZH...LPQX', to: 'GDLP...X3PZ', status: 'success' },
    { id: '2', type: 'deposit', amount: '200.00', asset: 'USDC', date: '2025-03-19T15:45:00Z', from: 'External', to: 'GBZH...LPQX', status: 'success' },
    { id: '3', type: 'withdrawal', amount: '0.005', asset: 'BTC', date: '2025-03-18T09:15:00Z', from: 'GBZH...LPQX', to: 'GAKL...R7PQ', status: 'success' }
  ];

  useEffect(() => {
    try {
      // Check for wallet in localStorage first
      const savedWallet = localStorage.getItem('eazeWallet');
      if (savedWallet) {
        const parsedWallet = JSON.parse(savedWallet);
        console.log('Loaded wallet from localStorage in Wallet component:', parsedWallet);
        setWallet(parsedWallet);
      } else {
        // If no wallet in localStorage, try to get it from the context
        getWallet();
      }
      
      // Load balance and transaction data
      getBalance();
      getTransactions();
    } catch (error) {
      console.log('Error loading wallet data:', error);
      console.log('Using mock data for testing');
    }
  }, []);

  const handleFundChange = (e) => {
    setFundData({
      ...fundData,
      [e.target.name]: e.target.value
    });
  };

  const handleWithdrawChange = (e) => {
    setWithdrawData({
      ...withdrawData,
      [e.target.name]: e.target.value
    });
  };

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    await fundWallet(fundData);
    setFundModal(false);
    setFundData({
      amount: '',
      asset: 'XLM'
    });
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    await withdrawFromWallet(withdrawData);
    setWithdrawModal(false);
    setWithdrawData({
      amount: '',
      asset: 'XLM',
      destination: ''
    });
  };

  // Available assets for funding and withdrawal
  const availableAssets = [
    { code: 'XLM', name: 'Stellar Lumens' },
    { code: 'USDC', name: 'USD Coin' },
    { code: 'EURT', name: 'Euro Token' },
    { code: 'NGNT', name: 'Nigerian Naira Token' },
    { code: 'KEST', name: 'Kenyan Shilling Token' },
    { code: 'TSHT', name: 'Tanzania Shilling Token' }
  ];

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Copy wallet address to clipboard
  const copyToClipboard = (text) => {
    if (!text) {
      console.error('No text to copy');
      return;
    }
    
    try {
      navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };
  
  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address || typeof address !== 'string') {
      console.log('Invalid address format:', address);
      return 'Not Available';
    }
    
    try {
      // Ensure address is a string and has sufficient length
      if (address.length < 8) {
        return address; // Return as is if too short
      }
      
      // Safe substring operations
      const firstPart = address.slice(0, 4);
      const lastPart = address.slice(-4);
      
      return showAddress ? address : `${firstPart}...${lastPart}`;
    } catch (error) {
      console.error('Error formatting wallet address:', error);
      return 'Invalid Address';
    }
  };
  
  // Check if wallet is connected
  const isWalletConnected = () => {
    return wallet && wallet.connected;
  };
  
  // Calculate total balance in XLM
  const calculateTotalBalance = () => {
    // Early return with safe default if balances aren't available or valid
    if (!displayBalances) {
      console.log('No balances available');
      return '0.00';
    }
    
    if (!Array.isArray(displayBalances)) {
      console.log('Balances is not an array:', displayBalances);
      return '0.00';
    }
    
    if (displayBalances.length === 0) {
      console.log('Balances array is empty');
      return '0.00';
    }
    
    try {
      // In a real app, you would convert all assets to a common denomination
      // For this demo, we'll just sum up the raw balances
      const total = displayBalances.reduce((total, balance) => {
        // Skip invalid balance objects
        if (!balance || typeof balance !== 'object') {
          console.log('Invalid balance item:', balance);
          return total;
        }
        
        // Extract and parse the balance value safely
        let balanceValue = 0;
        try {
          balanceValue = parseFloat(balance.balance || 0);
        } catch (parseError) {
          console.error('Error parsing balance:', parseError);
        }
        
        // Add to total, defaulting to 0 for NaN values
        return total + (isNaN(balanceValue) ? 0 : balanceValue);
      }, 0);
      
      return total.toFixed(2);
    } catch (error) {
      console.error('Error calculating total balance:', error);
      return '0.00';
    }
  };
  
  // Toggle wallet connection modal
  const toggleConnectWalletModal = () => {
    setConnectWalletModal(!connectWalletModal);
  };

  // Use real wallet data if available, fall back to mock data only if needed
  const displayWallet = wallet || mockWallet || { address: '', name: 'Demo Wallet', connected: false };
  
  // Add a console log to see the current wallet state
  console.log('Current wallet state:', wallet);
  console.log('Display wallet:', displayWallet);
  
  // Update wallet connection status based on the wallet object
  useEffect(() => {
    if (wallet) {
      console.log('Wallet connected:', wallet);
      // If we have a wallet object, ensure it's marked as connected
      if (!wallet.connected) {
        const updatedWallet = { ...wallet, connected: true };
        // Update the wallet context
        if (typeof setWallet === 'function') {
          setWallet(updatedWallet);
          
          // Also update localStorage
          try {
            localStorage.setItem('eazeWallet', JSON.stringify(updatedWallet));
            console.log('Updated wallet in localStorage');
          } catch (err) {
            console.error('Error saving wallet to localStorage:', err);
          }
        }
      }
    }
  }, [wallet, setWallet]);
  
  // Ensure balances is an array before checking length
  const displayBalances = Array.isArray(balances) && balances.length > 0 
    ? balances 
    : mockBalances;
  
  // Ensure transactions is an array before checking length
  const displayTransactions = Array.isArray(transactions) && transactions.length > 0 
    ? transactions 
    : mockTransactions;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="relative">
          <div className="absolute inset-0 bg-black rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-l-2 border-r-2 border-transparent border-t-blue-500 border-l-purple-500 border-r-cyan-500"></div>
            <p className="text-white mt-4 font-light">Loading your digital assets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        {/* Wallet Connection Status Banner */}
        {displayWallet && displayWallet.connected === true && (
          <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-green-500/30 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-3 animate-pulse"></div>
                <p className="text-green-400 font-medium">Wallet Connected Successfully</p>
              </div>
              <div className="flex items-center">
                <p className="text-green-300/70 text-sm mr-3">{formatWalletAddress(displayWallet.address)}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(displayWallet.address);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="text-green-400 hover:text-green-300 transition-all duration-300"
                >
                  {copySuccess ? 'Copied!' : <FaCopy size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Header Section */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-1">
          <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent)]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-purple-500/20 blur-xl"></div>
          </div>
          <div className="relative rounded-[calc(1.5rem-4px)] bg-gray-950/80 backdrop-blur p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                  <BiChip className="text-blue-400 text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Your Wallet</h1>
                  {displayWallet && displayWallet.connected === true && (
                    <div className="flex items-center mt-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                      <p className="text-green-400 text-sm">Connected</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-blue-200/70 mt-2 font-light">Next-gen digital asset management</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => displayWallet && displayWallet.connected === true ? setFundModal(true) : toggleConnectWalletModal()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-5 rounded-xl transition duration-300 flex items-center shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
              >
                <FaRocket className="mr-2" size={14} /> {displayWallet && displayWallet.connected === true ? 'Fund Wallet' : 'Connect Wallet'}
              </button>
              {displayWallet && displayWallet.connected === true && (
                <button
                  onClick={() => setWithdrawModal(true)}
                  className="bg-gray-800/80 hover:bg-gray-800 text-white font-medium py-2.5 px-5 rounded-xl transition duration-300 flex items-center border border-gray-700 hover:border-blue-500/50"
                >
                  <FaArrowUp className="mr-2" size={14} /> Withdraw
                </button>
              )}
            </div>
          </div>
        </div>

      {displayWallet ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Wallet Info Card */}
          <div className="md:col-span-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/30 transition-all duration-500 group">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-blue-300 flex items-center">
                    <FaFingerprint className="mr-2 text-blue-400" /> Secure Wallet
                  </h2>
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      <FaShieldAlt className="text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Balance</p>
                      <p className="text-2xl font-bold text-white">{calculateTotalBalance()} <span className="text-blue-400">XLM</span></p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowQR(!showQR)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    <FaQrcode size={18} />
                  </button>
                  <Link 
                    to="/send-money" 
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex items-center shadow-lg shadow-blue-900/20"
                  >
                    <FaPaperPlane className="mr-2" size={14} /> Send
                  </Link>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-sm">Wallet Address</p>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setShowAddress(!showAddress)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {showAddress ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                    <button 
                      className={`text-gray-400 hover:text-white transition-colors ${copySuccess ? 'text-green-400' : ''}`}
                      onClick={() => {
                        if (displayWallet && displayWallet.address) {
                          copyToClipboard(displayWallet.address);
                        } else {
                          console.log('No wallet address available to copy');
                        }
                      }}
                      aria-label="Copy wallet address"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 font-mono text-sm text-gray-300 flex items-center justify-between">
                  <span className="truncate">
                    {displayWallet && typeof displayWallet === 'object' 
                      ? formatWalletAddress(displayWallet.address) 
                      : 'No Wallet Connected'}
                  </span>
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">Stellar</span>
                </div>
                {copySuccess && <p className="text-green-400 text-xs mt-1">Address copied to clipboard!</p>}
              </div>
              
              {showQR && (
                <div className="mt-4 p-4 bg-white rounded-lg inline-block">
                  {/* In a real app, this would be a QR code component */}
                  <div className="h-32 w-32 bg-gray-800 flex items-center justify-center">
                    <span className="text-xs text-white">QR Code Placeholder</span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <div className="flex space-x-3">
                <button 
                  onClick={() => setFundModal(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex items-center flex-1 justify-center border border-gray-700 hover:border-blue-500/30"
                >
                  <FaPlus className="mr-2" size={14} /> Fund
                </button>
                <button 
                  onClick={() => setWithdrawModal(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex items-center flex-1 justify-center border border-gray-700 hover:border-blue-500/30"
                >
                  <FaArrowUp className="mr-2" size={14} /> Withdraw
                </button>
                <Link 
                  to="/swap" 
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex items-center flex-1 justify-center border border-gray-700 hover:border-blue-500/30"
                >
                  <BiTransfer className="mr-2" size={16} /> Swap
                </Link>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Card */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/30 transition-all duration-500">
            <div className="p-6">
              <h2 className="text-lg font-medium text-blue-300 flex items-center">
                <FaChartLine className="mr-2 text-blue-400" /> Quick Stats
              </h2>
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-gray-400 text-sm">Assets</p>
                  <p className="text-xl font-bold text-white">{displayBalances ? displayBalances.length : 0}</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-gray-400 text-sm">Transactions</p>
                  <p className="text-xl font-bold text-white">{displayTransactions ? displayTransactions.length : 0}</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-gray-400 text-sm">Last Activity</p>
                  <p className="text-xl font-bold text-white">
                    {displayTransactions && displayTransactions.length > 0 
                      ? displayTransactions[0].date ? new Date(displayTransactions[0].date).toLocaleDateString() : 'Recent'
                      : 'No activity'}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <button 
                  onClick={() => getBalance()}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center border border-gray-700 hover:border-blue-500/30"
                >
                  <BiRefresh className="mr-2" size={16} /> Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 p-8 mb-8 text-center">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
              <FaWallet className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your Stellar wallet to access your digital assets and manage transactions securely.</p>
            <div className="space-y-4 w-full max-w-xs">
              <button
                onClick={toggleConnectWalletModal}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition duration-300 flex items-center justify-center shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
              >
                <FaWallet className="mr-2" /> Connect Wallet
              </button>
              <p className="text-sm text-blue-400">Your wallet data is stored locally and securely</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 mb-8">
        <div className="flex border-b border-gray-800 p-1">
          <button
            className={`px-6 py-3 font-medium text-sm focus:outline-none transition-all duration-300 flex items-center rounded-t-lg ${
              activeTab === 'balances' 
                ? 'text-blue-400 bg-gray-800/80 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
            onClick={() => setActiveTab('balances')}
          >
            <FaWallet className="mr-2" /> Assets
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm focus:outline-none transition-all duration-300 flex items-center rounded-t-lg ${
              activeTab === 'transactions' 
                ? 'text-blue-400 bg-gray-800/80 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            <FaHistory className="mr-2" /> Transactions
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'balances' && (
            <div>
              <h3 className="text-xl font-bold text-blue-300 mb-6 flex items-center">
                <BiChip className="mr-2 text-blue-400" /> Digital Assets
              </h3>
              
              {displayBalances && displayBalances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead>
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">Asset</th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {displayBalances.map((balance, index) => (
                        <tr key={index} className="hover:bg-gray-800/50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-gray-700">
                                {balance.asset_type === 'native' ? (
                                  <span className="text-blue-400 font-semibold">XLM</span>
                                ) : (
                                  <span className="text-blue-400 font-semibold">{balance.asset_code}</span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {balance.asset_type === 'native' ? 'Stellar Lumens (XLM)' : balance.asset_code}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {balance.asset_type === 'native' ? 'Native Asset' : `Issuer: ${balance.asset_issuer ? balance.asset_issuer.substring(0, 8) + '...' : 'Unknown'}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <span className="text-white font-bold">{parseFloat(balance.balance).toFixed(7)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => {
                                  setWithdrawData({
                                    ...withdrawData,
                                    asset: balance.asset_type === 'native' ? 'XLM' : balance.asset_code
                                  });
                                  setWithdrawModal(true);
                                }}
                                className="text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center border border-gray-700 hover:border-blue-500/30"
                              >
                                <FaArrowUp className="mr-1" size={12} /> Withdraw
                              </button>
                              <Link 
                                to="/send-money" 
                                className="text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center shadow-md"
                              >
                                <FaPaperPlane className="mr-1" size={12} /> Send
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                    <FaWallet className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-400 mb-4">No assets found in your wallet.</p>
                  <button
                    onClick={() => setFundModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-5 rounded-xl transition duration-300 flex items-center mx-auto shadow-lg shadow-blue-900/20"
                  >
                    <FaPlus className="mr-2" size={14} /> Fund Your Wallet
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-xl font-bold text-blue-300 mb-6 flex items-center">
                <FaExchangeAlt className="mr-2 text-blue-400" /> Transaction History
              </h3>
              
              {displayTransactions && displayTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead>
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {displayTransactions.map((tx, index) => (
                        <tr key={index} className="hover:bg-gray-800/50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {tx.date ? new Date(tx.date).toLocaleString() : 'Recent'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-md ${
                              tx.type === 'payment' ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50' : 
                              tx.type === 'create_account' ? 'bg-purple-900/30 text-purple-300 border border-purple-800/50' :
                              'bg-gray-800 text-gray-300 border border-gray-700'
                            }`}>
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {tx.type === 'payment' ? (
                              <div className="flex items-center">
                                {tx.from === displayWallet?.address ? 
                                  <FaArrowUp className="mr-2 text-red-400" size={14} /> : 
                                  <FaArrowDown className="mr-2 text-green-400" size={14} />
                                }
                                <span>
                                  {tx.from === displayWallet?.address ? 'To: ' : 'From: '}
                                  <span className="font-mono text-gray-300">{tx.to ? tx.to.substring(0, 8) : ''}</span>
                                </span>
                              </div>
                            ) : (
                              <span>
                                {tx.type.replace('_', ' ')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <span className={`${tx.from === wallet?.publicKey ? 'text-red-400' : 'text-green-400'} font-bold`}>
                              {tx.from === wallet?.publicKey ? '-' : '+'}
                              {parseFloat(tx.amount).toFixed(7)} {tx.asset_type === 'native' ? 'XLM' : tx.asset_code}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                    <FaExchangeAlt className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-400">No transactions found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fund Wallet Modal */}
      {fundModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-800 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                  <FaRocket className="text-blue-400 text-xl" />
                </div>
                <h3 className="text-xl font-bold text-white">Fund Your Wallet</h3>
              </div>
              <button 
                onClick={() => setFundModal(false)}
                className="text-gray-400 hover:text-white transition duration-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleFundSubmit}>
              <div className="mb-5">
                <label className="block text-blue-300 text-sm font-medium mb-2" htmlFor="amount">
                  Amount
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all duration-200 text-white placeholder-gray-500"
                    id="amount"
                    type="number"
                    step="0.0000001"
                    placeholder="Enter amount"
                    name="amount"
                    value={fundData.amount}
                    onChange={handleFundChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">{fundData.asset}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-blue-300 text-sm font-medium mb-2" htmlFor="asset">
                  Asset
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all duration-200 text-white appearance-none"
                    id="asset"
                    name="asset"
                    value={fundData.asset}
                    onChange={handleFundChange}
                    required
                  >
                    {availableAssets.map((asset, index) => (
                      <option key={index} value={asset.code}>
                        {asset.name} ({asset.code})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setFundModal(false)}
                  className="px-5 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center shadow-lg shadow-blue-900/30"
                >
                  <FaPlus className="mr-2" size={14} /> Fund Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-800 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                  <FaArrowUp className="text-blue-400 text-xl" />
                </div>
                <h3 className="text-xl font-bold text-white">Withdraw Funds</h3>
              </div>
              <button 
                onClick={() => setWithdrawModal(false)}
                className="text-gray-400 hover:text-white transition duration-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit}>
              <div className="mb-5">
                <label className="block text-blue-300 text-sm font-medium mb-2" htmlFor="withdraw-amount">
                  Amount
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all duration-200 text-white placeholder-gray-500"
                    id="withdraw-amount"
                    type="number"
                    step="0.0000001"
                    placeholder="Enter amount"
                    name="amount"
                    value={withdrawData.amount}
                    onChange={handleWithdrawChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">{withdrawData.asset}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-5">
                <label className="block text-blue-300 text-sm font-medium mb-2" htmlFor="withdraw-asset">
                  Asset
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all duration-200 text-white appearance-none"
                    id="withdraw-asset"
                    name="asset"
                    value={withdrawData.asset}
                    onChange={handleWithdrawChange}
                    required
                  >
                    {availableAssets.map((asset, index) => (
                      <option key={index} value={asset.code}>
                        {asset.name} ({asset.code})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-blue-300 text-sm font-medium mb-2" htmlFor="destination">
                  Destination Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <BiLock className="text-gray-500" />
                  </div>
                  <input
                    className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all duration-200 font-mono text-sm text-white placeholder-gray-500"
                    id="destination"
                    type="text"
                    placeholder="Enter Stellar address"
                    name="destination"
                    value={withdrawData.destination}
                    onChange={handleWithdrawChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setWithdrawModal(false)}
                  className="px-5 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center shadow-lg shadow-blue-900/30"
                >
                  <FaArrowUp className="mr-2" size={14} /> Withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Connect Wallet Modal */}
      {connectWalletModal && <ConnectWalletModal isOpen={connectWalletModal} onClose={() => setConnectWalletModal(false)} />}
      </div>
    </div>
  );
};

export default Wallet;
