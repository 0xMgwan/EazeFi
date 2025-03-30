import React, { useState, useEffect, useCallback } from 'react';
import { FaExchangeAlt, FaArrowRight, FaArrowLeft, FaExternalLinkAlt, FaClock, FaSync } from 'react-icons/fa';
import { format } from 'date-fns';

const TransactionHistory = ({ limit }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-renders

  // Define loadTransactions as a useCallback to avoid recreation on each render
  const loadTransactions = useCallback(() => {
    console.log('Loading transactions from storage...');
    setLoading(true);
    
    try {
      // First, try to load from the main transactions array
      let allTransactions = [];
      try {
        const storedTransactions = JSON.parse(localStorage.getItem('eazeTransactions') || '[]');
        if (Array.isArray(storedTransactions)) {
          allTransactions = storedTransactions;
          console.log(`Loaded ${allTransactions.length} transactions from main storage`);
        } else {
          console.warn('Main transactions storage is not an array');
        }
      } catch (mainError) {
        console.error('Error loading from main transactions storage:', mainError);
      }
      
      // Then, try to load individual transactions as a backup
      try {
        // Find all keys that start with eazeTransaction_
        const individualTransactions = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('eazeTransaction_')) {
            try {
              const transaction = JSON.parse(localStorage.getItem(key));
              individualTransactions.push(transaction);
            } catch (parseError) {
              console.error(`Error parsing individual transaction ${key}:`, parseError);
            }
          }
        }
        
        if (individualTransactions.length > 0) {
          console.log(`Found ${individualTransactions.length} individual transactions`);
          
          // Merge with main transactions, avoiding duplicates
          const existingIds = new Set(allTransactions.map(tx => tx.id));
          for (const tx of individualTransactions) {
            if (tx.id && !existingIds.has(tx.id)) {
              allTransactions.push(tx);
              existingIds.add(tx.id);
            }
          }
        }
      } catch (individualError) {
        console.error('Error loading individual transactions:', individualError);
      }
      
      // Sort by date (newest first)
      allTransactions.sort((a, b) => {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
      
      console.log(`Total unique transactions loaded: ${allTransactions.length}`);
      setTransactions(allTransactions);
      
      // Update the main storage with our consolidated list
      if (allTransactions.length > 0) {
        localStorage.setItem('eazeTransactions', JSON.stringify(allTransactions));
      }
    } catch (error) {
      console.error('Error in transaction loading process:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Force a refresh of transactions
  const refreshTransactions = useCallback(() => {
    console.log('Manually refreshing transactions...');
    loadTransactions();
    setRefreshKey(prev => prev + 1); // Force re-render
  }, [loadTransactions]);

  useEffect(() => {
    // Initial load
    loadTransactions();
    
    // Set up event listeners
    const handleStorageChange = (e) => {
      if (e && (e.key === 'eazeTransactions' || e.key?.startsWith('eazeTransaction_'))) {
        console.log('Storage event detected for transactions:', e.key);
        loadTransactions();
      }
    };
    
    const handleTransactionComplete = (e) => {
      console.log('Transaction complete event detected', e.detail);
      // Small delay to ensure storage is updated
      setTimeout(loadTransactions, 100);
    };
    
    // Register event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('eazeTransactionComplete', handleTransactionComplete);
    
    // Set up polling for transactions
    const intervalId = setInterval(() => {
      loadTransactions();
    }, 5000); // Check every 5 seconds
    
    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('eazeTransactionComplete', handleTransactionComplete);
      clearInterval(intervalId);
    };
  }, [loadTransactions, refreshKey]);

  // Format date to a readable string
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Truncate long strings (like addresses)
  const truncateString = (str, maxLength = 8) => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength / 2)}...${str.substring(str.length - maxLength / 2)}`;
  };

  // Get transaction type icon
  const getTransactionIcon = (transaction) => {
    return <FaExchangeAlt className="text-blue-500" />;
  };

  // Get transaction direction (sent/received)
  const getTransactionDirection = (transaction) => {
    return (
      <div className="flex items-center text-blue-600">
        <FaArrowRight className="mr-1" />
        <span>Sent</span>
      </div>
    );
  };

  // Render transaction list
  const renderTransactions = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FaClock className="mx-auto text-3xl mb-2 opacity-50" />
          <p>No transactions yet</p>
          <p className="text-sm mt-1">Your transaction history will appear here</p>
        </div>
      );
    }

    // Apply limit if provided
    const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

    return displayTransactions.map((tx, index) => (
      <div key={tx.id || index} className="border-b border-gray-100 py-4 last:border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 bg-blue-50 p-2 rounded-full">
              {getTransactionIcon(tx)}
            </div>
            <div>
              <div className="font-medium">
                {tx.recipientType === 'phone' 
                  ? `To ${tx.recipientName} (${truncateString(tx.recipientIdentifier, 10)})` 
                  : `To ${tx.recipientName} (${truncateString(tx.recipientIdentifier, 10)})`}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDate(tx.date)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-red-500">
              -{tx.amount} {tx.asset}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {tx.recipientAmount} {tx.recipientAsset}
            </div>
          </div>
        </div>
        
        {tx.transactionHash && (
          <div className="mt-2 text-xs">
            <a 
              href={`https://stellar.expert/explorer/testnet/tx/${tx.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 flex items-center w-fit"
            >
              View on Explorer <FaExternalLinkAlt className="ml-1 text-xs" />
            </a>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Transaction History</h3>
        <button 
          onClick={refreshTransactions}
          className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
          title="Refresh transaction history"
        >
          <FaSync className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="px-4 divide-y divide-gray-100">
        {loading && transactions.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          renderTransactions()
        )}
      </div>
      {limit && transactions.length > limit && (
        <div className="px-4 py-3 border-t border-gray-100 text-center">
          <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
            View All Transactions
          </button>
        </div>
      )}
      {/* Debug info - remove in production */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
        {transactions.length} transaction(s) loaded
      </div>
    </div>
  );
};

export default TransactionHistory;
