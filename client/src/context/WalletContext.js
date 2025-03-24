import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [familyPools, setFamilyPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Make wallet context available globally for ConnectWalletModal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.walletContext = { 
        setWallet: (newWallet) => {
          console.log('Setting wallet from global context:', newWallet);
          setWallet(newWallet);
          
          // Save wallet to localStorage for persistence
          try {
            localStorage.setItem('eazeWallet', JSON.stringify(newWallet));
          } catch (err) {
            console.error('Error saving wallet to localStorage:', err);
          }
        },
        getWallet: () => wallet
      };
    }
  }, [wallet]);
  
  // Load wallet from localStorage on initial load
  useEffect(() => {
    try {
      const savedWallet = localStorage.getItem('eazeWallet');
      if (savedWallet) {
        const parsedWallet = JSON.parse(savedWallet);
        console.log('Loaded wallet from localStorage:', parsedWallet);
        setWallet(parsedWallet);
      }
    } catch (err) {
      console.error('Error loading wallet from localStorage:', err);
    }
  }, []);

  // Get wallet
  const getWallet = async () => {
    try {
      setLoading(true);
      
      // Use mock data for testnet
      const mockWallet = {
        id: 'wallet_' + Math.random().toString(36).substring(2, 10),
        address: 'GDEMO' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        type: 'stellar',
        name: wallet?.name || 'Default Wallet',
        connected: wallet?.connected || false,
        createdAt: new Date().toISOString()
      };
      
      setWallet(mockWallet);
      setLoading(false);
      return mockWallet;
    } catch (err) {
      console.error('Error getting wallet:', err);
      setError('Error fetching wallet');
      setLoading(false);
      return null;
    }
  };

  // Get wallet balance
  const getBalance = async () => {
    try {
      setLoading(true);
      
      // Use mock data for testnet
      const mockBalances = [
        {
          asset: 'XLM',
          amount: (Math.random() * 1000).toFixed(2),
          value_usd: (Math.random() * 500).toFixed(2)
        },
        {
          asset: 'USDC',
          amount: (Math.random() * 500).toFixed(2),
          value_usd: (Math.random() * 500).toFixed(2)
        }
      ];
      
      setBalances(mockBalances);
      setLoading(false);
      return mockBalances;
    } catch (err) {
      console.error('Error getting balance:', err);
      setError('Error fetching balance');
      setLoading(false);
      return [];
    }
  };

  // Fund wallet
  const fundWallet = async (fundData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/wallets/fund`,
        fundData,
        config
      );
      
      setWallet(res.data.wallet);
      await getBalance();
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error funding wallet');
      setLoading(false);
      return null;
    }
  };

  // Withdraw from wallet
  const withdrawFromWallet = async (withdrawData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/wallets/withdraw`,
        withdrawData,
        config
      );
      
      setWallet(res.data.wallet);
      await getBalance();
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error withdrawing from wallet');
      setLoading(false);
      return null;
    }
  };

  // Swap currencies
  const swapCurrencies = async (swapData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/wallets/swap`,
        swapData,
        config
      );
      
      setWallet(res.data.wallet);
      await getBalance();
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error swapping currencies');
      setLoading(false);
      return null;
    }
  };

  // Send remittance
  const sendRemittance = async (remittanceData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/remittances/send`,
        remittanceData,
        config
      );
      
      // Update balances after sending remittance
      await getBalance();
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error sending remittance');
      setLoading(false);
      return null;
    }
  };

  // Get user's remittances
  const getUserRemittances = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/remittances`);
      setRemittances(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Error getting remittances:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error fetching remittances');
      setLoading(false);
      return [];
    }
  };

  // Get remittance by ID
  const getRemittanceById = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/remittances/${id}`);
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Error getting remittance:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error fetching remittance');
      setLoading(false);
      return null;
    }
  };

  // Create family pool
  const createFamilyPool = async (poolData) => {
    try {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new mock family pool
      const newPool = {
        id: 'pool_' + Math.random().toString(36).substring(2, 8),
        name: poolData.name,
        description: poolData.description,
        token: poolData.token,
        createdAt: new Date().toISOString(),
        createdBy: 'user_123', // Current user ID
        isActive: true,
        withdrawalLimit: poolData.withdrawalLimit,
        withdrawalPeriod: poolData.withdrawalPeriod,
        contributions: [],
        withdrawals: []
      };
      
      // Update family pools list by adding the new pool
      const updatedPools = [...familyPools, newPool];
      setFamilyPools(updatedPools);
      
      setLoading(false);
      return { pool: newPool, success: true };
    } catch (err) {
      console.error('Error creating family pool:', err);
      setError('Error creating family pool');
      setLoading(false);
      return null;
    }
  };

  // Contribute to family pool
  const contributeToPool = async (poolId, amount) => {
    try {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the pool to contribute to
      const updatedPools = familyPools.map(pool => {
        if (pool.id === poolId) {
          // Create a new contribution
          const newContribution = {
            id: 'contrib_' + Math.random().toString(36).substring(2, 8),
            contributorId: 'user_123', // Current user ID
            contributorName: 'David Machuche', // Current user name
            amount: amount,
            createdAt: new Date().toISOString()
          };
          
          // Add the contribution to the pool
          return {
            ...pool,
            contributions: [...pool.contributions, newContribution]
          };
        }
        return pool;
      });
      
      setFamilyPools(updatedPools);
      
      // Update balances
      await getBalance();
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Error contributing to family pool:', err);
      setError('Error contributing to family pool');
      setLoading(false);
      return null;
    }
  };

  // Withdraw from family pool
  const withdrawFromPool = async (poolId, amount, reason) => {
    try {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the pool to withdraw from
      const updatedPools = familyPools.map(pool => {
        if (pool.id === poolId) {
          // Check if withdrawal is allowed based on limit
          const totalWithdrawn = pool.withdrawals.reduce(
            (sum, w) => sum + parseFloat(w.amount), 0
          );
          
          const withdrawalLimit = parseFloat(pool.withdrawalLimit);
          
          if (totalWithdrawn + parseFloat(amount) > withdrawalLimit) {
            throw new Error(`Withdrawal exceeds the limit of ${withdrawalLimit} ${pool.token} per ${pool.withdrawalPeriod}`);
          }
          
          // Create a new withdrawal
          const newWithdrawal = {
            id: 'withdraw_' + Math.random().toString(36).substring(2, 8),
            withdrawerId: 'user_123', // Current user ID
            withdrawerName: 'David Machuche', // Current user name
            amount: amount,
            reason: reason || 'General withdrawal',
            createdAt: new Date().toISOString()
          };
          
          // Add the withdrawal to the pool
          return {
            ...pool,
            withdrawals: [...pool.withdrawals, newWithdrawal]
          };
        }
        return pool;
      });
      
      setFamilyPools(updatedPools);
      
      // Update balances
      await getBalance();
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Error withdrawing from family pool:', err);
      setError(err.message || 'Error withdrawing from family pool');
      setLoading(false);
      return null;
    }
  };

  // Get family pools
  const getFamilyPools = async () => {
    try {
      setLoading(true);
      
      // Mock family pools data
      const mockFamilyPools = [
        {
          id: 'pool_1',
          name: 'Family Emergency Fund',
          description: 'For unexpected medical expenses and emergencies',
          token: 'USDC',
          createdAt: '2025-01-15T10:30:00Z',
          createdBy: 'user_123',
          isActive: true,
          withdrawalLimit: '500',
          withdrawalPeriod: 'month',
          contributions: [
            {
              id: 'contrib_1',
              contributorId: 'user_123',
              contributorName: 'David Machuche',
              amount: '200',
              createdAt: '2025-01-15T14:20:00Z'
            },
            {
              id: 'contrib_2',
              contributorId: 'user_456',
              contributorName: 'Sarah Johnson',
              amount: '150',
              createdAt: '2025-01-18T09:45:00Z'
            },
            {
              id: 'contrib_3',
              contributorId: 'user_789',
              contributorName: 'Michael Chen',
              amount: '300',
              createdAt: '2025-02-05T16:30:00Z'
            }
          ],
          withdrawals: [
            {
              id: 'withdraw_1',
              withdrawerId: 'user_123',
              withdrawerName: 'David Machuche',
              amount: '100',
              reason: 'Medical checkup',
              createdAt: '2025-02-10T11:20:00Z'
            }
          ]
        },
        {
          id: 'pool_2',
          name: 'Education Fund',
          description: 'For school fees and educational materials',
          token: 'XLM',
          createdAt: '2025-02-01T08:15:00Z',
          createdBy: 'user_123',
          isActive: true,
          withdrawalLimit: '1000',
          withdrawalPeriod: 'quarter',
          contributions: [
            {
              id: 'contrib_4',
              contributorId: 'user_123',
              contributorName: 'David Machuche',
              amount: '500',
              createdAt: '2025-02-01T09:30:00Z'
            },
            {
              id: 'contrib_5',
              contributorId: 'user_456',
              contributorName: 'Sarah Johnson',
              amount: '750',
              createdAt: '2025-02-15T14:20:00Z'
            }
          ],
          withdrawals: []
        },
        {
          id: 'pool_3',
          name: 'Wedding Fund',
          description: 'For upcoming family wedding expenses',
          token: 'USDC',
          createdAt: '2024-11-20T16:45:00Z',
          createdBy: 'user_789',
          isActive: false,
          withdrawalLimit: '2000',
          withdrawalPeriod: 'event',
          contributions: [
            {
              id: 'contrib_6',
              contributorId: 'user_123',
              contributorName: 'David Machuche',
              amount: '400',
              createdAt: '2024-11-25T10:15:00Z'
            },
            {
              id: 'contrib_7',
              contributorId: 'user_456',
              contributorName: 'Sarah Johnson',
              amount: '350',
              createdAt: '2024-12-05T13:40:00Z'
            },
            {
              id: 'contrib_8',
              contributorId: 'user_789',
              contributorName: 'Michael Chen',
              amount: '600',
              createdAt: '2024-12-20T09:30:00Z'
            }
          ],
          withdrawals: [
            {
              id: 'withdraw_2',
              withdrawerId: 'user_789',
              withdrawerName: 'Michael Chen',
              amount: '1200',
              reason: 'Venue booking',
              createdAt: '2025-01-10T15:20:00Z'
            }
          ]
        },
        {
          id: 'pool_4',
          name: 'Tanzania Business Fund',
          description: 'For supporting family business initiatives in Tanzania',
          token: 'TSHT',
          createdAt: '2025-03-10T09:00:00Z',
          createdBy: 'user_123',
          isActive: true,
          withdrawalLimit: '50000',
          withdrawalPeriod: 'month',
          contributions: [
            {
              id: 'contrib_9',
              contributorId: 'user_123',
              contributorName: 'David Machuche',
              amount: '25000',
              createdAt: '2025-03-10T10:15:00Z'
            },
            {
              id: 'contrib_10',
              contributorId: 'user_456',
              contributorName: 'Sarah Johnson',
              amount: '15000',
              createdAt: '2025-03-12T14:30:00Z'
            }
          ],
          withdrawals: [
            {
              id: 'withdraw_3',
              withdrawerId: 'user_123',
              withdrawerName: 'David Machuche',
              amount: '10000',
              reason: 'Business supplies',
              createdAt: '2025-03-15T16:45:00Z'
            }
          ]
        }
      ];
      
      setFamilyPools(mockFamilyPools);
      setLoading(false);
      return mockFamilyPools;
    } catch (err) {
      console.error('Error getting family pools:', err);
      setError('Error fetching family pools');
      setLoading(false);
      return [];
    }
  };

  // Send crypto to M-Pesa
  const sendCryptoToMpesa = async (mpesaData) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the backend API
      // const res = await axios.post(`${process.env.REACT_APP_API_URL}/mpesa/send`, mpesaData);
      
      // For demo purposes, we'll simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock remittance record
      const newRemittance = {
        id: 'mpesa_' + Math.random().toString(36).substring(2, 8),
        sender: 'user_123', // Current user ID
        senderName: 'David Machuche',
        recipientPhone: mpesaData.recipientPhone,
        recipientName: mpesaData.recipientName,
        amount: mpesaData.amount,
        currency: mpesaData.sourceCurrency,
        targetAmount: mpesaData.targetAmount,
        targetCurrency: 'TZS',
        status: 'processing',
        type: 'mpesa',
        createdAt: new Date().toISOString(),
        notes: mpesaData.notes || '',
        insurance: mpesaData.insurance || false,
        transactionId: 'tx_' + Math.random().toString(36).substring(2, 10)
      };
      
      // Update remittances list
      setRemittances([newRemittance, ...remittances]);
      
      // Update balances (deduct the sent amount + fees)
      await getBalance();
      
      setLoading(false);
      return { success: true, remittance: newRemittance };
    } catch (err) {
      console.error('Error sending crypto to M-Pesa:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error sending crypto to M-Pesa');
      setLoading(false);
      return { success: false, error: err.response?.data?.msg || 'Error sending crypto to M-Pesa' };
    }
  };
  
  // Check M-Pesa remittance status
  const checkMpesaRemittanceStatus = async (remittanceId) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the backend API
      // const res = await axios.get(`${process.env.REACT_APP_API_URL}/mpesa/status/${remittanceId}`);
      
      // For demo purposes, we'll simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the remittance to update
      const updatedRemittances = remittances.map(remittance => {
        if (remittance.id === remittanceId) {
          // Randomly set status to either 'completed' or 'processing'
          const newStatus = Math.random() > 0.5 ? 'completed' : 'processing';
          return {
            ...remittance,
            status: newStatus,
            lastChecked: new Date().toISOString()
          };
        }
        return remittance;
      });
      
      setRemittances(updatedRemittances);
      
      const updatedRemittance = updatedRemittances.find(r => r.id === remittanceId);
      
      setLoading(false);
      return { success: true, status: updatedRemittance.status };
    } catch (err) {
      console.error('Error checking M-Pesa remittance status:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error checking remittance status');
      setLoading(false);
      return { success: false, error: err.response?.data?.msg || 'Error checking remittance status' };
    }
  };

  // Clear errors
  const clearErrors = () => setError(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      getWallet();
      getBalance();
      getUserRemittances();
      getFamilyPools();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, authLoading]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        balances,
        transactions,
        remittances,
        familyPools,
        loading,
        error,
        getWallet,
        getBalance,
        fundWallet,
        withdrawFromWallet,
        swapCurrencies,
        sendRemittance,
        getUserRemittances,
        getRemittanceById,
        createFamilyPool,
        contributeToPool,
        withdrawFromPool,
        getFamilyPools,
        sendCryptoToMpesa,
        checkMpesaRemittanceStatus,
        clearErrors
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
