import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';
import { FaWallet, FaExchangeAlt, FaArrowRight, FaPlus, FaArrowUp, FaArrowDown, FaCopy, FaPaperPlane, FaHistory, FaChartLine, FaQrcode, FaShieldAlt, FaEye, FaEyeSlash, FaFingerprint, FaRocket } from 'react-icons/fa';
import { BiTransfer, BiRefresh, BiLock, BiChip } from 'react-icons/bi';
import ConnectWalletModal from './ConnectWalletModal';
import FundTestnetWallet from './FundTestnetWallet';
import DebugBalanceChecker from './DebugBalanceChecker';
import DirectBalanceDisplay from './DirectBalanceDisplay';
import TopBalanceDisplay from './TopBalanceDisplay';
import axios from 'axios';

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
    { asset_code: 'USDC', balance: '500.00', asset_type: 'credit_alphanum4', asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
    { asset_code: 'TSHT', balance: '248730.00', asset_type: 'credit_alphanum4', asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' }
  ];

  const mockTransactions = [
    { id: 'tx1', type: 'payment', amount: '100.00', asset: 'XLM', from: 'SENDER123', to: 'RECEIVER456', date: new Date().toISOString() },
    { id: 'tx2', type: 'payment', amount: '50.00', asset: 'XLM', from: 'SENDER789', to: 'RECEIVER123', date: new Date(Date.now() - 86400000).toISOString() }
  ];

  // Helper function to copy wallet address to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Helper function to format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return 'No Address';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Use mock data if no wallet is connected
  const displayWallet = wallet || mockWallet;
  const displayBalances = balances && balances.length > 0 ? balances : mockBalances;
  const displayTransactions = transactions && transactions.length > 0 ? transactions : mockTransactions;

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 space-y-6">
          {/* Wallet Card */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/30 transition-all duration-500">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-blue-300 flex items-center">
                  <FaWallet className="mr-2 text-blue-400" /> Wallet
                </h2>
                <button 
                  onClick={() => setConnectWalletModal(true)}
                  className="flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                >
                  <BiChip className="text-lg" />
                  <span className="ml-1 text-sm">Connect</span>
                </button>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <FaShieldAlt className="text-white" />
                  </div>
                  <div>
                    <TopBalanceDisplay walletAddress={displayWallet?.address} />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
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
                
                {/* Debug section - shows full wallet address */}
                <div className="mt-2 p-2 bg-gray-800/30 rounded border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Full wallet address (for debugging):</p>
                  <p className="text-xs font-mono text-gray-300 break-all">
                    {displayWallet?.address || 'No wallet connected'}
                  </p>
                  <button 
                    onClick={() => {
                      if (displayWallet?.address) {
                        window.open(`https://stellar.expert/explorer/testnet/account/${displayWallet.address}`, '_blank');
                      }
                    }}
                    className="mt-2 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-1 px-2 rounded border border-blue-500/30 w-full"
                  >
                    View on Stellar Explorer
                  </button>
                  
                  {/* Direct Balance Display */}
                  <DirectBalanceDisplay walletAddress={displayWallet?.address} />
                  
                  {/* Debug Balance Checker */}
                  <DebugBalanceChecker 
                    walletAddress={displayWallet?.address}
                    onBalanceFound={(foundBalances) => {
                      console.log('Debug balance checker found balances:', foundBalances);
                      // We can't directly update balances here, but we can trigger a refresh
                      if (foundBalances && foundBalances.length > 0) {
                        // Force a refresh of the wallet context
                        getBalance();
                      }
                    }}
                  />
                </div>
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
              {/* Direct Testnet Funding Component */}
              {/* Direct Fund Testnet Wallet Button */}
              <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4 mb-4">
                <div className="flex items-center mb-3">
                  <div className="text-yellow-400 mr-3">
                    <FaRocket size={18} />
                  </div>
                  <h3 className="text-yellow-300 font-medium">Fund Testnet Wallet</h3>
                </div>
                
                <p className="text-yellow-200/70 text-sm mb-4">
                  New to EazeFi? Get free testnet XLM to try out all features. This is for testing only and has no real value.
                </p>
                
                <button
                  onClick={async () => {
                    if (!wallet || !wallet.address) {
                      alert('Please connect your wallet first');
                      setConnectWalletModal(true);
                      return;
                    }
                    
                    try {
                      // Call Friendbot API directly
                      await axios.get(`https://friendbot.stellar.org?addr=${wallet.address}`);
                      alert('Your wallet has been funded with testnet XLM!');
                      
                      // Refresh balance after funding
                      setTimeout(() => {
                        getBalance();
                      }, 2000);
                    } catch (error) {
                      console.error('Error funding wallet:', error);
                      alert('This wallet has already been funded or there was an error with the Friendbot service.');
                    }
                  }}
                  className="w-full py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-all duration-300 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                >
                  <FaRocket className="mr-2" size={14} />
                  Fund Wallet with Testnet XLM
                </button>
                <p className="text-yellow-200/50 text-xs mt-2">Powered by Stellar Friendbot. Limited to one funding per wallet.</p>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    if (wallet && wallet.address) {
                      // Direct fund action
                      window.open('https://laboratory.stellar.org/#account-creator?network=test', '_blank');
                    } else {
                      alert('Please connect your wallet first');
                      setConnectWalletModal(true);
                    }
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex items-center flex-1 justify-center border border-gray-700 hover:border-blue-500/30"
                >
                  <FaPlus className="mr-2" size={14} /> Fund
                </button>
                <button 
                  onClick={() => {
                    if (wallet && wallet.address) {
                      // Direct withdraw action
                      window.open(`https://laboratory.stellar.org/#txbuilder?network=test&source=${wallet.address}`, '_blank');
                    } else {
                      alert('Please connect your wallet first');
                      setConnectWalletModal(true);
                    }
                  }}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-blue-300 flex items-center">
                  <FaChartLine className="mr-2 text-blue-400" /> Quick Stats
                </h2>
                <button
                  onClick={() => {
                    // Force a hard refresh of wallet data
                    console.log('Forcing hard refresh of wallet data');
                    if (wallet && wallet.address) {
                      // Clear any cached data
                      localStorage.removeItem('eazeWalletBalances');
                      // Call both functions with a slight delay between them
                      getBalance()
                        .then(balances => {
                          console.log('Balances refreshed:', balances);
                          setTimeout(() => {
                            getTransactions()
                              .then(txs => console.log('Transactions refreshed:', txs))
                              .catch(err => console.error('Error refreshing transactions:', err));
                          }, 500);
                        })
                        .catch(err => console.error('Error refreshing balances:', err));
                    } else {
                      alert('No wallet connected. Please connect a wallet first.');
                    }
                  }}
                  className="flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                  title="Refresh wallet data"
                >
                  <BiRefresh className="text-lg" />
                  <span className="ml-1 text-sm">Refresh</span>
                </button>
              </div>
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
      </div>

      {/* Connect Wallet Modal */}
      <ConnectWalletModal 
        isOpen={connectWalletModal}
        onClose={() => {
          console.log('Closing wallet modal from Wallet component');
          setConnectWalletModal(false);
        }}
        onConnect={(walletData) => {
          console.log('Wallet connected from Wallet component', walletData);
          setWallet(walletData);
          setConnectWalletModal(false);
        }}
      />
    </div>
  );
};

export default Wallet;
