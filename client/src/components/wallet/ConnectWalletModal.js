import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaExternalLinkAlt, FaChevronRight, FaSpinner, FaWallet } from 'react-icons/fa';  
import StellarSdk from 'stellar-sdk';
import { WalletContext } from '../../context/WalletContext';
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

// Use real wallet icons from direct sources
const albedoIcon = 'https://albedo.link/img/logo.png';
const lobstrIcon = 'https://lobstr.co/static/images/lobstr-logo.png';
const freighterIcon = 'https://freighter.app/assets/images/freighter-logo.png';
const xbullIcon = 'https://xbull.app/assets/icons/icon-192x192.png';

// Add polyfill for Freighter detection
if (typeof window !== 'undefined' && !window.freighter) {
  // Check if freighter exists in window.stellar
  if (window.stellar && window.stellar.freighter) {
    window.freighter = window.stellar.freighter;
    console.log('Found Freighter in window.stellar');
  }
}

const ConnectWalletModal = ({ isOpen, onClose, onConnect }) => {
  const navigate = useNavigate();
  const walletContext = useContext(WalletContext);
  const { setWallet, connectWalletWithKit, walletKit } = walletContext;
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Always use real wallet connections
  const [useMockWallets] = useState(false);
  
  // Initialize Stellar SDK with error handling
  let server;
  try {
    server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
  } catch (error) {
    console.error('Failed to initialize Stellar SDK:', error);
    server = null;
  }
  
  // Initialize Stellar Wallets Kit if not available from context
  const [localWalletKit, setLocalWalletKit] = useState(null);
  
  useEffect(() => {
    if (!walletKit && !localWalletKit) {
      try {
        // Initialize with specific modules and a default selected wallet ID
        // The key issue was missing the selectedWalletId parameter
        const kit = new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          // Set a default selected wallet ID to avoid the "undefined" error
          selectedWalletId: ALBEDO_ID,
          modules: [
            new AlbedoModule(),
            new FreighterModule(),
            new LobstrModule(),
            new xBullModule()
          ]
        });
        setLocalWalletKit(kit);
        console.log('Initialized local Stellar Wallets Kit instance with specific modules and default wallet');
      } catch (err) {
        console.error('Error initializing local Stellar Wallets Kit:', err);
      }
    }
  }, [walletKit, localWalletKit]);
  
  // Reset state when modal opens
  useEffect(() => {
    setConnecting(false);
    setSelectedWallet(null);
    setError(null);
    setSuccess(false);
  }, []);
  
  // Helper function to create a mock wallet for development testing
  const createMockWallet = (walletName) => {
    const mockAddress = 'G' + walletName.toUpperCase().substring(0, 4) + Math.random().toString(36).substring(2, 10).toUpperCase();
    return {
      id: walletName.toLowerCase() + '_' + Date.now(),
      name: walletName,
      address: mockAddress,
      type: 'stellar',
      connected: true,
      network: 'TESTNET',
      createdAt: new Date().toISOString()
    };
  };
  
  // Helper function to handle post-connection actions
  const handleSuccessfulConnection = (walletData) => {
    // Set success state
    setSuccess(true);
    setConnecting(false);
    
    // Call the onConnect callback with the wallet data
    if (onConnect && typeof onConnect === 'function') {
      onConnect(walletData);
    }
    
    // Close modal after a short delay
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Modal is always open when rendered

  const wallets = [
    {
      name: 'Albedo',
      logoColor: '#3e7bfa',
      logo: albedoIcon,
      description: 'Browser-based wallet for Stellar',
      url: 'https://albedo.link/',
      popular: true,
      mockConnect: () => createMockWallet('Albedo')
    },
    {
      name: 'Lobstr',
      logoColor: '#3c14d3',
      logo: lobstrIcon,
      description: 'Mobile and web wallet for Stellar',
      url: 'https://lobstr.co/',
      popular: true,
      mockConnect: () => createMockWallet('Lobstr')
    },
    {
      name: 'Freighter',
      logoColor: '#0e41f5',
      logo: freighterIcon,
      description: 'Browser extension wallet for Stellar',
      url: 'https://www.freighter.app/',
      popular: true,
      mockConnect: () => createMockWallet('Freighter')
    },
    {
      name: 'Xbull',
      logoColor: '#000000',
      logo: xbullIcon,
      description: 'Advanced wallet for Stellar',
      url: 'https://xbull.app/',
      popular: false,
      mockConnect: () => createMockWallet('Xbull')
    }
  ];
  
  const connectFreighterWallet = async () => {
    try {
      console.log('Attempting to connect to Freighter...');
      
      // Use mock wallet in development mode only if explicitly enabled
      if (useMockWallets) {
        console.log('Using mock Freighter wallet');
        const walletData = wallets.find(w => w.name === 'Freighter').mockConnect();
        
        if (setWallet) {
          setWallet(walletData);
        }
        
        // Handle successful connection
        handleSuccessfulConnection(walletData);
        
        return { success: true, publicKey: walletData.address, walletData, isMock: true };
      }
      
      // Try multiple ways to detect Freighter
      let freighter = null;
      
      if (window.freighter) {
        console.log('Found Freighter in window.freighter');
        freighter = window.freighter;
      } else if (window.stellar && window.stellar.freighter) {
        console.log('Found Freighter in window.stellar.freighter');
        freighter = window.stellar.freighter;
      } else {
        // Try to detect Freighter with a small delay
        // Sometimes browser extensions take a moment to initialize
        try {
          console.log('Attempting to detect Freighter with delay...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (window.freighter) {
            console.log('Found Freighter after delay');
            freighter = window.freighter;
          } else if (window.stellar && window.stellar.freighter) {
            console.log('Found Freighter in window.stellar after delay');
            freighter = window.stellar.freighter;
          } else {
            // If Freighter is still not found, return error
            console.log('Freighter extension not detected after delay');
            return { success: false, error: 'Freighter extension not detected. Please install it from www.freighter.app' };
          }
        } catch (detectionError) {
          console.error('Error during Freighter detection:', detectionError);
          return { success: false, error: 'Error detecting Freighter extension. Please refresh and try again.' };
        }
      }
      
      // Check if Freighter is connected to Testnet
      try {
        // Give Freighter a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Make sure freighter is still available
        if (!freighter) {
          if (window.freighter) {
            freighter = window.freighter;
          } else if (window.stellar && window.stellar.freighter) {
            freighter = window.stellar.freighter;
          } else {
            throw new Error('Freighter became unavailable');
          }
        }
        
        console.log('Checking Freighter network...');
        const network = await freighter.getNetwork();
        console.log('Freighter network:', network);
        
        // Accept both TESTNET and TEST as valid networks
        if (network !== 'TESTNET' && network !== 'TEST') {
          return { 
            success: false, 
            error: 'Please switch Freighter to Testnet network to connect with this application.' 
          };
        }
      } catch (networkError) {
        console.warn('Could not verify Freighter network:', networkError);
        // Continue anyway, as we'll try to get the public key regardless
        console.log('Continuing with connection attempt despite network check error');
      }
      
      // Freighter was found, attempt to connect
      try {
        // First, try to connect - this will prompt the user to approve the connection
        console.log('Attempting to connect to Freighter...');
        try {
          // This will prompt the user to approve the connection
          await freighter.connect();
          console.log('Freighter connect call completed');
        } catch (connectError) {
          console.warn('Error connecting to Freighter:', connectError);
          // If connect fails with an error, it might be because the user rejected the request
          return { success: false, error: 'Connection to Freighter was rejected or failed. Please try again.' };
        }
        
        // After successful connection, request public key
        console.log('Requesting public key from Freighter...');
        let publicKey;
        
        try {
          publicKey = await freighter.getPublicKey();
          console.log('Received public key from Freighter:', publicKey);
        } catch (pkError) {
          console.error('Error getting public key from Freighter:', pkError);
          // Try an alternative method
          try {
            console.log('Trying alternative method to get public key...');
            // Sometimes the user needs to be prompted again
            await freighter.connect();
            publicKey = await freighter.getPublicKey();
            console.log('Received public key from alternative method:', publicKey);
          } catch (altError) {
            console.error('Alternative method also failed:', altError);
            throw new Error('Failed to get public key from Freighter. Please make sure Freighter is unlocked and try again.');
          }
        }
        
        if (!publicKey) {
          console.error('No public key returned from Freighter');
          throw new Error('Failed to get public key from Freighter');
        }
        
        // Get network information
        let network = 'TESTNET';
        try {
          network = await freighter.getNetwork();
          console.log('Freighter network:', network);
        } catch (networkError) {
          console.warn('Could not get network from Freighter:', networkError);
        }
        
        // Create wallet data
        const walletData = {
          id: 'freighter_' + Date.now(),
          name: 'Freighter',
          address: publicKey,
          type: 'stellar',
          connected: true,
          network: network,
          createdAt: new Date().toISOString()
        };
        
        // Update wallet context - try multiple methods to ensure it works
        if (setWallet) {
          console.log('Updating wallet via component context');
          setWallet(walletData);
        }
        
        // Also try the global context
        if (window.walletContext && typeof window.walletContext.setWallet === 'function') {
          console.log('Updating wallet via global context');
          window.walletContext.setWallet(walletData);
        }
        
        // As a fallback, save directly to localStorage
        try {
          localStorage.setItem('eazeWallet', JSON.stringify(walletData));
          console.log('Saved wallet directly to localStorage');
        } catch (err) {
          console.error('Error saving wallet to localStorage:', err);
        }
        
        return { success: true, publicKey, walletData };
      } catch (apiError) {
        console.error('Error calling Freighter API:', apiError);
        return { success: false, error: apiError.message || 'Error connecting to Freighter' };
      }
    } catch (error) {
      console.error('Freighter connection error:', error);
      return { success: false, error: error.message || 'Unknown error connecting to Freighter' };
    }
  };
  
  const connectAlbedoWallet = async () => {
    try {
      // Use mock wallet in development mode only if explicitly enabled
      if (useMockWallets) {
        console.log('Using mock Albedo wallet');
        const walletData = wallets.find(w => w.name === 'Albedo').mockConnect();
        
        if (setWallet) {
          setWallet(walletData);
        }
        
        // Handle successful connection
        handleSuccessfulConnection(walletData);
        
        return { success: true, publicKey: walletData.address, walletData, isMock: true };
      }
      
      // Always use a working approach for Albedo
      try {
        console.log('Using Albedo wallet connection...');
        
        // Force load Albedo regardless of detection status
        try {
          console.log('Attempting to load Albedo dynamically...');
          await new Promise((resolve) => {
            // Create a script element to load Albedo
            const script = document.createElement('script');
            script.src = 'https://albedo.link/albedo-intent.js';
            script.onload = () => {
              console.log('Albedo script loaded successfully');
              resolve();
            };
            script.onerror = () => {
              console.warn('Failed to load Albedo script, but continuing anyway');
              resolve(); // Resolve anyway to try the built-in method
            };
            document.head.appendChild(script);
            
            // Set a timeout to resolve anyway after 1 second
            setTimeout(resolve, 1000);
          });
        } catch (loadError) {
          console.warn('Error during Albedo script loading:', loadError);
          // Continue anyway - the extension might still work
        }
        
        // Request public key using Albedo
        // First check if Albedo is available
        if (typeof window.albedo === 'undefined') {
          console.warn('Albedo still not available after loading script');
          // Try alternate method - create a direct intent link
          const intentUrl = 'https://albedo.link/intent/publicKey?callback=postMessage&require_existing=true';
          window.open(intentUrl, '_blank');
          throw new Error('Please use the Albedo popup window that just opened to connect your wallet');
        }
        
        console.log('Attempting to get public key from Albedo...');
        const result = await window.albedo.publicKey({
          require_existing: true
        });
        
        console.log('Albedo result:', result);
        
        if (!result || !result.pubkey) {
          throw new Error('Failed to get public key from Albedo');
        }
        
        // Create wallet data with the real public key
        const walletData = {
          id: 'albedo_' + Date.now(),
          name: 'Albedo',
          address: result.pubkey,
          type: 'stellar',
          connected: true,
          network: 'TESTNET',
          createdAt: new Date().toISOString()
        };
        
        console.log('Albedo connection successful:', walletData);
        
        // Update wallet context - try multiple methods to ensure it works
        if (setWallet) {
          console.log('Updating wallet via component context');
          setWallet(walletData);
        }
        
        // Also try the global context
        if (window.walletContext && typeof window.walletContext.setWallet === 'function') {
          console.log('Updating wallet via global context');
          window.walletContext.setWallet(walletData);
        }
        
        // As a fallback, save directly to localStorage
        try {
          localStorage.setItem('eazeWallet', JSON.stringify(walletData));
          console.log('Saved wallet directly to localStorage');
        } catch (err) {
          console.error('Error saving wallet to localStorage:', err);
        }
        
        return { success: true, publicKey: result.pubkey, walletData };
      } catch (albedoError) {
        console.error('Error interacting with Albedo:', albedoError);
        return { success: false, error: albedoError.message || 'Error connecting to Albedo. Please try again.' };
      }
    } catch (error) {
      console.error('Albedo connection error:', error);
      return { success: false, error: error.message || 'Unknown error connecting to Albedo' };
    }
  };
  
  const connectXbullWallet = async () => {
    try {
      // Use mock wallet in development mode only if explicitly enabled
      if (useMockWallets) {
        console.log('Using mock XBull wallet');
        const walletData = wallets.find(w => w.name === 'Xbull').mockConnect();
        
        if (setWallet) {
          setWallet(walletData);
        }
        
        // Handle successful connection
        handleSuccessfulConnection(walletData);
        
        return { success: true, publicKey: walletData.address, walletData, isMock: true };
      }
      
      // XBull wallet connection
      // Note: This implementation depends on how XBull wallet exposes its API
      // You may need to adjust this based on XBull's documentation
      if (typeof window !== 'undefined' && window.xBull) {
        try {
          // This is a placeholder for XBull API - replace with actual API when available
          const publicKey = await window.xBull.getPublicKey();
          
          if (!publicKey) {
            throw new Error('Failed to get public key from XBull');
          }
          
          // Create wallet data
          const walletData = {
            id: 'xbull_' + Date.now(),
            name: 'XBull',
            address: publicKey,
            type: 'stellar',
            connected: true,
            network: 'TESTNET',
            createdAt: new Date().toISOString()
          };
          
          // Update wallet context
          if (setWallet) {
            setWallet(walletData);
          }
          
          return { success: true, publicKey, walletData };
        } catch (apiError) {
          console.error('Error calling XBull API:', apiError);
          return { success: false, error: apiError.message || 'Error connecting to XBull' };
        }
      } else {
        return { success: false, error: 'XBull wallet not installed. Please visit xbull.app to get started' };
      }
    } catch (error) {
      console.error('XBull connection error:', error);
      return { success: false, error: error.message || 'Unknown error connecting to XBull' };
    }
  };
  
  const connectLobstrWallet = async () => {
    try {
      // Use mock wallet in development mode only if explicitly enabled
      if (useMockWallets) {
        console.log('Using mock Lobstr wallet');
        const walletData = wallets.find(w => w.name === 'Lobstr').mockConnect();
        
        if (setWallet) {
          setWallet(walletData);
        }
        
        // Handle successful connection
        handleSuccessfulConnection(walletData);
        
        return { success: true, publicKey: walletData.address, walletData, isMock: true };
      }
      
      // For Lobstr, we need to generate a QR code or deep link
      // This implementation will depend on Lobstr's API and documentation
      // For now, we'll provide instructions to the user
      return { success: false, error: 'Please install the LOBSTR app and scan a QR code to connect. This feature will be implemented soon.' };
    } catch (error) {
      console.error('LOBSTR connection error:', error);
      return { success: false, error: error.message || 'Unknown error connecting to LOBSTR' };
    }
  };

  const handleConnectWallet = async (walletName) => {
    console.log(`Connecting to ${walletName} using Stellar Wallets Kit...`);
    setConnecting(true);
    setSelectedWallet(walletName);
    setError(null);
    setSuccess(false);
    
    try {
      // Map wallet name to wallet ID for Stellar Wallets Kit
      let walletId;
      switch (walletName) {
        case 'Albedo':
          walletId = ALBEDO_ID;
          break;
        case 'Freighter':
          walletId = FREIGHTER_ID;
          break;
        case 'Lobstr':
          walletId = LOBSTR_ID;
          break;
        case 'Xbull':
          walletId = XBULL_ID;
          break;
        default:
          throw new Error(`Unsupported wallet: ${walletName}`);
      }
      
      // Get the wallet kit from context, local state, or global context
      let kit = walletKit || localWalletKit;
      if (!kit && window.walletContext && window.walletContext.getWalletKit) {
        kit = window.walletContext.getWalletKit();
      }
      
      // Special handling for Freighter wallet
      if (walletName === 'Freighter') {
        console.log('Freighter wallet selected - ensuring Freighter module is added');
        
        // Check if we need to add the Freighter module
        let needToAddFreighterModule = true;
        
        // Check if the kit already has the Freighter module
        if (kit && kit.modules) {
          try {
            const hasFreighter = kit.modules.some(module => 
              module.constructor.name === 'FreighterModule' || 
              (module.id && module.id === FREIGHTER_ID)
            );
            if (hasFreighter) {
              console.log('Freighter module already present in kit');
              needToAddFreighterModule = false;
            }
          } catch (err) {
            console.warn('Error checking for Freighter module:', err);
          }
        }
        
        // If we need to add the Freighter module, create a new kit with it
        if (needToAddFreighterModule) {
          console.log('Adding Freighter module to wallet kit');
          try {
            // Create a new kit with the Freighter module included
            const newKit = new StellarWalletsKit({
              network: WalletNetwork.TESTNET,
              selectedWalletId: FREIGHTER_ID,
              modules: [
                new FreighterModule(),
                new AlbedoModule(),
                new LobstrModule(),
                new xBullModule()
              ],
              autoAllowDirect: false,
              disableAutoConnect: true
            });
            
            // Update the kit references
            setLocalWalletKit(newKit);
            kit = newKit;
            console.log('Created new wallet kit with Freighter module');
          } catch (err) {
            console.error('Error creating new kit with Freighter:', err);
          }
        }
      } else if (!kit) {
        // For non-Freighter wallets, create a kit without Freighter module if none exists
        console.log(`Creating new Stellar Wallets Kit instance for ${walletName}`);
        const newKit = new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          selectedWalletId: walletId,
          modules: [
            new AlbedoModule(),
            new LobstrModule(),
            new xBullModule()
            // Freighter module intentionally excluded to prevent auto-connection
          ],
          autoAllowDirect: false,
          disableAutoConnect: true
        });
        setLocalWalletKit(newKit);
        kit = newKit;
      }
      
      // Set the selected wallet - this is the key step that was causing the error
      console.log(`Setting wallet ID to: ${walletId}`);
      kit.setWallet(walletId);
      
      // Get the wallet address
      const { address } = await kit.getAddress();
      
      if (!address) {
        throw new Error('Failed to get wallet address');
      }
      
      // Format the address for display
      const shortAddress = address.length > 10 
        ? `${address.slice(0, 5)}...${address.slice(-5)}` 
        : address;
      
      console.log(`Successfully connected to ${walletName}!\nPublic Key: ${shortAddress}`);
      
      // Create wallet data object
      const walletData = {
        id: `${walletId}_${Date.now()}`,
        name: walletName,
        address: address,
        type: 'stellar',
        connected: true,
        network: 'TESTNET',
        walletId: walletId, // Store the wallet ID for reconnection
        createdAt: new Date().toISOString()
      };
      
      // Update state and localStorage
      console.log('Updating wallet state with connected wallet:', walletData);
      
      // First update the global context to ensure immediate UI update
      if (window.walletContext && typeof window.walletContext.setWallet === 'function') {
        window.walletContext.setWallet(walletData);
      }
      
      // Then update the local component context if available
      if (typeof setWallet === 'function') {
        setWallet(walletData);
      }
      
      // Force update the WalletContext state
      if (walletContext && typeof walletContext.setWallet === 'function') {
        walletContext.setWallet(walletData);
      }
      
      // Always save to localStorage as a backup
      localStorage.setItem('eazeWallet', JSON.stringify(walletData));
      
      // Force update any components that depend on the wallet state
      if (typeof window !== 'undefined') {
        // Dispatch a custom event that components can listen for
        const walletConnectedEvent = new CustomEvent('walletConnected', { detail: walletData });
        window.dispatchEvent(walletConnectedEvent);
      }
      
      // Show success message
      setSuccess(true);
      
      // Call the onConnect callback with the wallet data
      if (onConnect && typeof onConnect === 'function') {
        onConnect(walletData);
      }
      
      // Set a timeout to show success message before redirecting to dashboard
      setTimeout(() => {
        setConnecting(false);
        onClose();
        // Redirect to dashboard after successful connection
        console.log('Redirecting to dashboard...');
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error(`Error connecting to ${walletName}:`, error);
      setError(error.message || `Error connecting to ${walletName}`);
      setConnecting(false);
    }
  };

  // If the modal is not open, don't render anything
  if (isOpen === false) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Connect Wallet</h2>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked');
              
              // Direct call to onClose function
              if (typeof onClose === 'function') {
                onClose();
              }
            }}
            className="text-gray-400 hover:text-black transition duration-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
            aria-label="Close modal"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4 text-lg">
            Connect with one of the available wallet providers or create a new one.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center">
              <FaWallet className="mr-2" /> Wallet connected successfully!
            </div>
          )}
          
          <div className="space-y-4 mt-4">
            {wallets.map((wallet) => (
              <div 
                key={wallet.name}
                className={`border border-gray-200 rounded-xl p-5 hover:border-black hover:shadow-md transition duration-300 cursor-pointer flex items-center group ${selectedWallet === wallet.name && connecting ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => !connecting && handleConnectWallet(wallet.name)}
              >
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mr-4 overflow-hidden border border-gray-100 group-hover:border-gray-300 transition-all duration-300">
                  {wallet.logo ? (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <img 
                        src={wallet.logo} 
                        alt={`${wallet.name} logo`} 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.log(`Error loading ${wallet.name} logo`);
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<div style="color: ${wallet.logoColor || '#000'}; font-weight: bold; font-size: 24px;">${wallet.name.charAt(0)}</div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ color: wallet.logoColor || '#000', fontWeight: 'bold', fontSize: '24px' }}>
                      {wallet.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-bold text-black text-lg">{wallet.name}</h3>
                    {wallet.popular && (
                      <span className="ml-2 bg-black text-white text-xs px-2 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{wallet.description}</p>
                </div>
                {selectedWallet === wallet.name && connecting ? (
                  <FaSpinner className="animate-spin text-blue-500" />
                ) : (
                  <FaChevronRight className="text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                New to Stellar? <a href="https://stellar.org/learn" target="_blank" rel="noopener noreferrer" className="text-black font-medium hover:underline">Learn more</a>
              </p>
              <a href="https://stellar.expert/explorer/public" target="_blank" rel="noopener noreferrer" className="text-black text-sm font-medium hover:underline flex items-center">
                View all wallets <FaExternalLinkAlt className="ml-1 text-xs" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;
