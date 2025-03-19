import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [familyPools, setFamilyPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get wallet
  const getWallet = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/wallets`);
      setWallet(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Error getting wallet:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error fetching wallet');
      setLoading(false);
      return null;
    }
  };

  // Get wallet balance
  const getBalance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/wallets/balance`);
      setBalances(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Error getting balance:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error fetching balance');
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
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/remittances/family-pool/create`,
        poolData,
        config
      );
      
      // Update family pools list
      await getFamilyPools();
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating family pool');
      setLoading(false);
      return null;
    }
  };

  // Contribute to family pool
  const contributeToFamilyPool = async (contributionData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/remittances/family-pool/contribute`,
        contributionData,
        config
      );
      
      // Update balances and family pools
      await getBalance();
      await getFamilyPools();
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error contributing to family pool');
      setLoading(false);
      return null;
    }
  };

  // Withdraw from family pool
  const withdrawFromFamilyPool = async (withdrawalData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/remittances/family-pool/withdraw`,
        withdrawalData,
        config
      );
      
      // Update family pools
      await getFamilyPools();
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error withdrawing from family pool');
      setLoading(false);
      return null;
    }
  };

  // Get family pools
  const getFamilyPools = async () => {
    try {
      setLoading(true);
      // This endpoint would need to be implemented on the server
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/remittances/family-pool`);
      setFamilyPools(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Error getting family pools:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error fetching family pools');
      setLoading(false);
      return [];
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
        contributeToFamilyPool,
        withdrawFromFamilyPool,
        getFamilyPools,
        clearErrors
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
