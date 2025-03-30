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

  // Get wallet balance
  const getBalance = async () => {
    try {
      setLoading(true);
      
      // Check if wallet is connected
      if (!wallet || !wallet.address) {
        setError('No wallet connected');
        setLoading(false);
        return [];
      }
      
      // Get balance from Stellar Horizon API
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const account = await server.loadAccount(wallet.address);
      
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
      
      setBalances(formattedBalances);
      setLoading(false);
      return formattedBalances;
    } catch (err) {
      console.error('Error getting balance:', err);
      setError('Error fetching balance');
      setLoading(false);
      return [];
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
        walletKit
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
