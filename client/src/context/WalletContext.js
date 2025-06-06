import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import StellarSdk from 'stellar-sdk';
import { AuthContext } from './AuthContext';
import { 
  StellarWalletsKit, 
  WalletNetwork, 
  allowAllModules,
  ALBEDO_ID,
  FREIGHTER_ID,
  XBULL_ID,
  LOBSTR_ID,
  AlbedoModule,
  FreighterModule,
  LobstrModule,
  xBullModule
} from '@creit.tech/stellar-wallets-kit';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [familyPools, setFamilyPools] = useState([]);
  const [loading, setLoading] = useState(false); // Changed to false to prevent initial loading state
  const [error, setError] = useState(null);
  const [walletKit, setWalletKit] = useState(null);
  const [walletInitialized, setWalletInitialized] = useState(false); // Flag to track initialization
  
  // Initialize Stellar Wallets Kit - only run once with a simpler approach
  useEffect(() => {
    // Skip if already initialized or if we already have a wallet kit
    if (walletInitialized || walletKit) return;
    
    try {
      console.log('Initializing Stellar Wallets Kit with simplified approach...');
      
      // Use the simpler allowAllModules approach but with auto-connect disabled
      // This should be more reliable than manually specifying modules
      const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        modules: allowAllModules(),
        selectedWalletId: ALBEDO_ID, // Default to Albedo to avoid undefined wallet ID
        autoAllowDirect: false,
      });
      
      // Mark as initialized to prevent multiple initializations
      setWalletInitialized(true);
      
      // Clear any existing Freighter wallet data from localStorage
      try {
        const savedWallet = localStorage.getItem('eazeWallet');
        if (savedWallet) {
          const parsedWallet = JSON.parse(savedWallet);
          if (parsedWallet.walletId === FREIGHTER_ID) {
            console.log('Found Freighter wallet in localStorage, removing to prevent auto-connection');
            localStorage.removeItem('eazeWallet');
          }
        }
      } catch (localStorageErr) {
        console.warn('Error checking localStorage:', localStorageErr);
      }
      
      console.log('Stellar Wallets Kit initialized with auto-connect disabled and Freighter excluded');
      setWalletKit(kit);
      
      // Make wallet context and kit available globally for ConnectWalletModal
      if (typeof window !== 'undefined') {
        window.walletContext = { 
          setWallet: (newWallet) => {
            console.log('Setting wallet from global context:', newWallet);
            
            // Update the wallet state
            setWallet(newWallet);
            
            // Save wallet to localStorage for persistence if not null
            try {
              if (newWallet) {
                localStorage.setItem('eazeWallet', JSON.stringify(newWallet));
              } else {
                localStorage.removeItem('eazeWallet');
              }
            } catch (err) {
              console.error('Error managing wallet in localStorage:', err);
            }
          },
          getWallet: () => wallet,
          getWalletKit: () => kit,
          walletKit: kit // Directly expose the kit instance
        };
      }
    } catch (err) {
      console.error('Error initializing Stellar Wallets Kit:', err);
      setError('Failed to initialize wallet connection system');
    }
  }, [walletInitialized, wallet]);
  
  // Load wallet from localStorage on initial load - only when walletKit is available
  useEffect(() => {
    // Skip if no wallet kit or if we already have a wallet
    if (!walletKit || wallet) return;
    
    try {
      console.log('Attempting to load wallet from localStorage...');
      const savedWallet = localStorage.getItem('eazeWallet');
      
      if (!savedWallet) {
        console.log('No wallet found in localStorage');
        return;
      }
      
      const parsedWallet = JSON.parse(savedWallet);
      console.log('Loaded wallet from localStorage:', parsedWallet);
      
      // Check if this is a Freighter wallet - don't auto-connect it
      if (parsedWallet.walletId === FREIGHTER_ID) {
        console.log('Freighter wallet detected - skipping auto-connection');
        // Don't set the wallet in state to prevent auto-connection
        // We'll still show the wallet in the UI, but not auto-connect it
        setWallet({
          ...parsedWallet,
          connected: false, // Mark as not connected to prevent auto-connection
          needsReconnect: true // Flag that this wallet needs manual reconnection
        });
        return;
      }
      
      // For other wallet types, proceed with auto-connection
      console.log('Non-Freighter wallet found, proceeding with auto-connection');
      setWallet(parsedWallet);
      
      // If we have a wallet and the kit is initialized, set the wallet in the kit
      // but only for non-Freighter wallets
      if (parsedWallet.walletId && parsedWallet.walletId !== FREIGHTER_ID) {
        console.log(`Setting wallet ID in kit: ${parsedWallet.walletId}`);
        try {
          walletKit.setWallet(parsedWallet.walletId);
        } catch (setWalletErr) {
          console.warn('Error setting wallet in kit:', setWalletErr);
        }
      }
    } catch (err) {
      console.error('Error loading wallet from localStorage:', err);
    }
  }, [walletKit, wallet]); // Only run when walletKit changes or wallet is null
  
  // Add a listener for wallet connection events
  useEffect(() => {
    const handleWalletConnected = (event) => {
      console.log('Wallet connected event received:', event.detail);
      // Update the wallet state
      setWallet(event.detail);
    };
    
    // Add event listener
    window.addEventListener('walletConnected', handleWalletConnected);
    
    // Clean up
    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected);
    };
  }, []);

  // Get wallet - safely retrieves the current wallet or creates a new one if needed
  const getWallet = async () => {
    try {
      setLoading(true);
      
      // If we already have a wallet, just return it
      if (wallet) {
        console.log('Using existing wallet:', wallet.address);
        setLoading(false);
        return wallet;
      }
      
      // Check if we have a wallet in localStorage
      const savedWallet = localStorage.getItem('eazeWallet');
      if (savedWallet) {
        try {
          const parsedWallet = JSON.parse(savedWallet);
          console.log('Retrieved wallet from localStorage:', parsedWallet.address);
          setWallet(parsedWallet);
          setLoading(false);
          return parsedWallet;
        } catch (err) {
          console.error('Error parsing wallet from localStorage:', err);
        }
      }
      
      // Generate a new wallet for the user if they don't have one yet
      console.log('No existing wallet found, generating a new one...');
      try {
        // Generate a new random Stellar keypair
        const keypair = StellarSdk.Keypair.random();
        const newWallet = {
          address: keypair.publicKey(),
          secret: keypair.secret(),
          walletId: 'EAZEFI_AUTO_GENERATED', // Mark as auto-generated
          connected: true,
          type: 'auto-generated'
        };
        
        console.log('Generated new wallet with address:', newWallet.address);
        
        // Save to localStorage for persistence
        localStorage.setItem('eazeWallet', JSON.stringify(newWallet));
        
        // Update state
        setWallet(newWallet);
        setLoading(false);
        return newWallet;
      } catch (genErr) {
        console.error('Error generating new wallet:', genErr);
        setLoading(false);
        return null;
      }
    } catch (err) {
      console.error('Error getting wallet:', err);
      setError('Error fetching wallet');
      setLoading(false);
      return null;
    }
  };

  // Get family pools
  const getFamilyPools = async () => {
    try {
      setLoading(true);
      
      // Check if wallet is connected
      if (!wallet || !wallet.address) {
        setError('No wallet connected');
        setLoading(false);
        return [];
      }
      
      // For demo purposes, return mock family pools
      // In a real app, this would fetch from your API or smart contract
      const mockFamilyPools = [
        {
          id: '1',
          name: 'Family Support Pool',
          description: 'Monthly remittances for family back home',
          token: 'XLM',
          balance: 500,
          members: [
            { email: 'parent@example.com', role: 'admin' },
            { email: 'sibling1@example.com', role: 'member' },
            { email: 'sibling2@example.com', role: 'member' }
          ],
          withdrawalLimit: 100,
          withdrawalPeriod: 'monthly',
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          contributions: [
            { contributorId: 'parent@example.com', amount: 300, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
            { contributorId: 'sibling1@example.com', amount: 150, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { contributorId: 'sibling2@example.com', amount: 50, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          withdrawals: [
            { withdrawerId: 'parent@example.com', amount: 100, reason: 'Emergency medical expenses', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        },
        {
          id: '2',
          name: 'Education Fund',
          description: 'College fund for younger siblings',
          token: 'USDC',
          balance: 1200,
          members: [
            { email: 'parent@example.com', role: 'admin' },
            { email: 'uncle@example.com', role: 'member' }
          ],
          withdrawalLimit: 200,
          withdrawalPeriod: 'quarterly',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          contributions: [
            { contributorId: 'parent@example.com', amount: 700, date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
            { contributorId: 'uncle@example.com', amount: 500, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          withdrawals: []
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

  // Get wallet balance
  const getBalance = async () => {
    try {
      setLoading(true);
      
      // Check if wallet is connected
      if (!wallet || !wallet.address) {
        console.log('No wallet connected, cannot fetch balance');
        setBalances([{
          asset: 'XLM',
          balance: 0,
          assetType: 'native',
          assetCode: 'XLM',
          assetIssuer: 'native',
        }]);
        setLoading(false);
        return [];
      }
      
      console.log('Fetching balance for wallet:', wallet.address);
      
      try {
        // Use fetch API directly instead of the Stellar SDK for more control
        console.log('Fetching balance using fetch API...');
        console.log(`Requesting from: https://horizon-testnet.stellar.org/accounts/${wallet.address}`);
        
        // Create a timeout promise to abort the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${wallet.address}`, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // If account doesn't exist (404) or other error, handle gracefully
          console.log(`Account fetch failed with status: ${response.status} ${response.statusText}`);
          
          // For 400 Bad Request, this typically means the account doesn't exist yet
          if (response.status === 400) {
            console.log('Account does not exist yet. This is normal for new wallets that need funding.');
            // Show a more informative message in the UI
            const defaultBalance = [{
              asset: 'XLM',
              balance: 0,
              assetType: 'native',
              assetCode: 'XLM',
              assetIssuer: 'native',
              needsFunding: true // Flag to indicate this account needs funding
            }];
            
            setBalances(defaultBalance);
            setLoading(false);
            return defaultBalance;
          }
          
          // For other errors, set a default balance of 0 XLM
          const defaultBalance = [{
            asset: 'XLM',
            balance: 0,
            assetType: 'native',
            assetCode: 'XLM',
            assetIssuer: 'native',
          }];
          
          setBalances(defaultBalance);
          setLoading(false);
          return defaultBalance;
        }
        
        // Parse the account data
        const account = await response.json();
        
        // Format balances
        const formattedBalances = account.balances.map(balance => {
          return {
            asset: balance.asset_type === 'native' ? 'XLM' : `${balance.asset_code}:${balance.asset_issuer}`,
            balance: parseFloat(balance.balance),
            limit: balance.limit ? parseFloat(balance.limit) : null,
            buyingLiabilities: balance.buying_liabilities ? parseFloat(balance.buying_liabilities) : 0,
            sellingLiabilities: balance.selling_liabilities ? parseFloat(balance.selling_liabilities) : 0,
            assetType: balance.asset_type,
            assetCode: balance.asset_code || 'XLM',
            assetIssuer: balance.asset_issuer || 'native',
          };
        });
        
        console.log('Balances fetched successfully:', formattedBalances);
        
        // Update all balance displays on the page for immediate feedback
        const xlmBalance = formattedBalances.find(b => b.assetType === 'native');
        if (xlmBalance) {
          const balance = xlmBalance.balance.toFixed(2);
          document.querySelectorAll('.balance-display').forEach(el => {
            el.textContent = balance;
          });
        }
        
        setBalances(formattedBalances);
        setLoading(false);
        return formattedBalances;
      } catch (error) {
        // Check if it's an AbortError (timeout)
        if (error.name === 'AbortError') {
          console.error('Fetch request timed out. Network may be slow.');
          // Try a fallback method with a longer timeout
          try {
            console.log('Attempting fallback fetch with longer timeout...');
            const fallbackResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${wallet.address}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              // Longer timeout for fallback
              timeout: 15000
            });
            
            if (fallbackResponse.ok) {
              const account = await fallbackResponse.json();
              
              // Format balances
              const formattedBalances = account.balances.map(balance => {
                return {
                  asset: balance.asset_type === 'native' ? 'XLM' : `${balance.asset_code}:${balance.asset_issuer}`,
                  balance: parseFloat(balance.balance),
                  limit: balance.limit ? parseFloat(balance.limit) : null,
                  buyingLiabilities: balance.buying_liabilities ? parseFloat(balance.buying_liabilities) : 0,
                  sellingLiabilities: balance.selling_liabilities ? parseFloat(balance.selling_liabilities) : 0,
                  assetType: balance.asset_type,
                  assetCode: balance.asset_code || 'XLM',
                  assetIssuer: balance.asset_issuer || 'native',
                };
              });
              
              console.log('Balances fetched successfully via fallback:', formattedBalances);
              setBalances(formattedBalances);
              setLoading(false);
              return formattedBalances;
            } else {
              throw new Error(`Fallback fetch failed with status: ${fallbackResponse.status}`);
            }
          } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError.message || fallbackError);
          }
        } else {
          console.error('Error fetching balance:', error.message || error);
        }
        
        // Set a default balance of 0 XLM for error cases
        const defaultBalance = [{
          asset: 'XLM',
          balance: 0,
          assetType: 'native',
          assetCode: 'XLM',
          assetIssuer: 'native',
        }];
        setBalances(defaultBalance);
        setLoading(false);
        return defaultBalance;
      }
    } catch (err) {
      console.error('Error getting balance:', err);
      // Don't set error for new accounts, just show 0 balance
      const defaultBalance = [{
        asset: 'XLM',
        balance: 0,
        assetType: 'native',
        assetCode: 'XLM',
        assetIssuer: 'native',
      }];
      setBalances(defaultBalance);
      setLoading(false);
      return defaultBalance;
    }
  };

  // Only fetch data when authenticated and not during initial load
  useEffect(() => {
    // Only proceed if we don't already have a wallet and we're authenticated
    if (isAuthenticated && !authLoading && !wallet) {
      // Don't automatically generate a wallet - this was causing the infinite loop
      // getWallet(); // Removed to prevent infinite loop of random keypair generation
      
      // These functions are safe to call
      getBalance();
    }
  }, [isAuthenticated, authLoading, wallet]);

  // Add mock functions for family pool operations
  const contributeToPool = async (poolId, amount) => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the pool balance
      const updatedPools = familyPools.map(pool => {
        if (pool.id === poolId) {
          return {
            ...pool,
            balance: pool.balance + parseFloat(amount),
            lastActivity: new Date().toISOString()
          };
        }
        return pool;
      });
      
      setFamilyPools(updatedPools);
      setLoading(false);
      return { success: true, message: 'Contribution successful' };
    } catch (err) {
      console.error('Error contributing to pool:', err);
      setError('Error contributing to pool');
      setLoading(false);
      throw err;
    }
  };
  
  const withdrawFromPool = async (poolId, amount, reason) => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the pool
      const pool = familyPools.find(p => p.id === poolId);
      
      if (!pool) {
        throw new Error('Pool not found');
      }
      
      if (parseFloat(amount) > pool.balance) {
        throw new Error('Insufficient funds in pool');
      }
      
      if (parseFloat(amount) > pool.withdrawalLimit) {
        throw new Error(`Withdrawal exceeds limit of ${pool.withdrawalLimit} ${pool.token}`);
      }
      
      // Update the pool balance
      const updatedPools = familyPools.map(p => {
        if (p.id === poolId) {
          return {
            ...p,
            balance: p.balance - parseFloat(amount),
            lastActivity: new Date().toISOString()
          };
        }
        return p;
      });
      
      setFamilyPools(updatedPools);
      setLoading(false);
      return { success: true, message: 'Withdrawal successful' };
    } catch (err) {
      console.error('Error withdrawing from pool:', err);
      setError(err.message || 'Error withdrawing from pool');
      setLoading(false);
      throw err;
    }
  };
  
  // Get transaction history for the connected wallet
  const getTransactions = async () => {
    try {
      setLoading(true);
      
      // Check if wallet is connected
      if (!wallet || !wallet.address) {
        console.log('No wallet connected, cannot fetch transactions');
        setTransactions([]);
        setLoading(false);
        return [];
      }
      
      console.log('Fetching transactions for wallet:', wallet.address);
      
      try {
        // Use fetch API directly instead of the Stellar SDK for more control
        console.log('Fetching transactions using fetch API...');
        console.log(`Requesting from: https://horizon-testnet.stellar.org/accounts/${wallet.address}/transactions?limit=10&order=desc`);
        
        // Create a timeout promise to abort the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${wallet.address}/transactions?limit=10&order=desc`, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // If account doesn't exist (404) or other error, handle gracefully
          console.log(`Transactions fetch failed with status: ${response.status} ${response.statusText}`);
          
          // For 400 Bad Request, this typically means the account doesn't exist yet
          if (response.status === 400) {
            console.log('Account does not exist yet. This is normal for new wallets that need funding.');
            // No need to show an error message for this case
            setError(null);
          } else {
            // For other errors, set an appropriate error message
            setError(`Error fetching transactions: ${response.statusText}`);
          }
          
          setTransactions([]);
          setLoading(false);
          return [];
        }
        
        // Parse the transactions data
        const data = await response.json();
        
        // Format transactions
        const formattedTransactions = data._embedded?.records?.map(tx => {
          return {
            id: tx.id,
            hash: tx.hash,
            ledger: tx.ledger,
            createdAt: tx.created_at,
            sourceAccount: tx.source_account,
            fee: tx.fee_charged,
            memo: tx.memo,
            memoType: tx.memo_type,
            operationCount: tx.operation_count,
            type: 'transaction'
          };
        }) || [];
        
        console.log('Transactions fetched successfully:', formattedTransactions);
        
        setTransactions(formattedTransactions);
        setLoading(false);
        return formattedTransactions;
      } catch (error) {
        // Check if it's an AbortError (timeout)
        if (error.name === 'AbortError') {
          console.error('Fetch request for transactions timed out. Network may be slow.');
          setError('Network timeout while fetching transactions. Please try again.');
        } else {
          console.error('Error fetching transactions:', error);
          setError(error.message || 'Error fetching transactions');
        }
        
        setTransactions([]);
        setLoading(false);
        return [];
      }
    } catch (err) {
      console.error('Error in getTransactions:', err);
      setError(err.message || 'Error fetching transactions');
      setTransactions([]);
      setLoading(false);
      return [];
    }
  };

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
        setWallet,
        getWallet,
        getBalance,
        getTransactions,
        getFamilyPools,
        contributeToPool,
        withdrawFromPool,
        walletKit
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
