import React, { useState, useContext, Fragment, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { WalletContext } from '../../context/WalletContext';
import { FaWallet, FaExchangeAlt, FaUsers, FaPaperPlane, FaHistory, FaUser, FaSignOutAlt, FaBars, FaTimes, FaLink, FaChevronRight, FaRocket, FaGlobe } from 'react-icons/fa';
import { HiOutlineSparkles, HiChip, HiCube } from 'react-icons/hi';
import { IoRocketSharp, IoFlash, IoAnalytics } from 'react-icons/io5';
import { RiDashboardLine, RiExchangeFundsFill, RiUserSettingsLine } from 'react-icons/ri';
import ConnectWalletModal from '../wallet/ConnectWalletModal';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  // Properly import from WalletContext
  const walletContext = useContext(WalletContext);
  const { wallet, setWallet } = walletContext || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHover, setActiveHover] = useState(null);
  const location = useLocation();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const onLogout = () => {
    logout();
    setIsMenuOpen(false);
  };
  
  const disconnectWallet = () => {
    // Clear wallet from context using the proper context method
    if (walletContext && typeof walletContext.setWallet === 'function') {
      walletContext.setWallet(null);
    } else if (window.walletContext && typeof window.walletContext.setWallet === 'function') {
      // Fallback to global context if available
      window.walletContext.setWallet(null);
    }
    
    // Remove from localStorage
    localStorage.removeItem('eazeWallet');
    
    // Close menu if open
    setIsMenuOpen(false);
    
    console.log('Wallet disconnected');
    
    // Show feedback to user
    alert('Wallet disconnected successfully');
  };
  
  const handleHover = (item) => {
    setActiveHover(item);
  };
  
  const handleHoverExit = () => {
    setActiveHover(null);
  };

  const NavLink = ({ to, icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <li className="py-2 md:py-0">
        <Link 
          to={to} 
          className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group
            ${isActive 
              ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white border border-neon-blue/30 shadow-glow-sm backdrop-blur-md' 
              : 'text-gray-200 hover:bg-dark-surface/60 hover:border border-neon-purple/10 backdrop-blur-sm'}`}
          onMouseEnter={() => handleHover(to)}
          onMouseLeave={handleHoverExit}
        >
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 animate-pulse-slow opacity-30"></div>
          )}
          <span className={`transition-all duration-300 ${isActive ? 'text-neon-blue' : 'text-gray-400 group-hover:text-neon-purple'}`}>
            {icon}
          </span>
          <span className={`ml-2 font-medium transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
            {children}
          </span>
          {isActive && (
            <div className="ml-auto flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-blue mr-1 animate-pulse"></div>
              <FaChevronRight className="text-neon-blue animate-pulse-slow" />
            </div>
          )}
        </Link>
      </li>
    );
  };

  const MobileNavLink = ({ to, icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <li className="mb-2">
        <Link 
          to={to} 
          className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group
            ${isActive 
              ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white border border-neon-blue/30 shadow-glow-sm backdrop-blur-md' 
              : 'text-gray-200 hover:bg-dark-surface/60 hover:border border-neon-purple/10 backdrop-blur-sm'}`}
          onMouseEnter={() => handleHover(to)}
          onMouseLeave={handleHoverExit}
        >
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 animate-pulse-slow opacity-30"></div>
          )}
          <span className={`text-xl transition-all duration-300 ${isActive ? 'text-neon-blue' : 'text-gray-400 group-hover:text-neon-purple'}`}>
            {icon}
          </span>
          <span className={`ml-3 font-medium transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
            {children}
          </span>
          {isActive && (
            <div className="ml-auto flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-blue mr-1 animate-pulse"></div>
              <FaChevronRight className="text-neon-blue animate-pulse-slow" />
            </div>
          )}
        </Link>
      </li>
    );
  };

  const authLinks = (
    <Fragment>
      <NavLink to="/dashboard" icon={<FaHistory className="text-lg" />}>Dashboard</NavLink>
      <NavLink to="/wallet" icon={<FaWallet className="text-lg" />}>Wallet</NavLink>
      <NavLink to="/swap" icon={<FaExchangeAlt className="text-lg" />}>Swap</NavLink>
      <NavLink to="/send-money" icon={<FaPaperPlane className="text-lg" />}>Send Money</NavLink>
      <NavLink to="/family-pools" icon={<FaUsers className="text-lg" />}>Family Pool</NavLink>
      <NavLink to="/profile" icon={<FaUser className="text-lg" />}>Profile</NavLink>
      <li className="py-2 md:py-0">
        <a 
          href="#!" 
          onClick={onLogout} 
          className="flex items-center px-4 py-2.5 rounded-xl text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 backdrop-blur-sm transition-all duration-300 group relative overflow-hidden"
          onMouseEnter={() => handleHover('logout')}
          onMouseLeave={handleHoverExit}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 opacity-30"></div>
          <FaSignOutAlt className="text-lg text-red-500 group-hover:animate-pulse relative z-10" />
          <span className="ml-2 font-medium relative z-10">Logout</span>
        </a>
      </li>
    </Fragment>
  );
  
  const mobileAuthLinks = (
    <Fragment>
      <MobileNavLink to="/dashboard" icon={<FaHistory className="text-xl" />}>Dashboard</MobileNavLink>
      <MobileNavLink to="/wallet" icon={<FaWallet className="text-xl" />}>Wallet</MobileNavLink>
      <MobileNavLink to="/swap" icon={<FaExchangeAlt className="text-xl" />}>Swap</MobileNavLink>
      <MobileNavLink to="/send-money" icon={<FaPaperPlane className="text-xl" />}>Send Money</MobileNavLink>
      <MobileNavLink to="/family-pools" icon={<FaUsers className="text-xl" />}>Family Pool</MobileNavLink>
      <MobileNavLink to="/profile" icon={<FaUser className="text-xl" />}>Profile</MobileNavLink>
      <li className="mt-5 pt-5 border-t border-neon-blue/10">
        <a 
          href="#!" 
          onClick={onLogout} 
          className="flex items-center px-5 py-3.5 rounded-xl text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 backdrop-blur-sm transition-all duration-300 group relative overflow-hidden"
          onMouseEnter={() => handleHover('logout-mobile')}
          onMouseLeave={handleHoverExit}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 opacity-30"></div>
          <FaSignOutAlt className="text-xl text-red-500 group-hover:animate-pulse relative z-10" />
          <span className="ml-3 font-medium relative z-10">Logout</span>
        </a>
      </li>
    </Fragment>
  );

  const guestLinks = (
    <Fragment>
      {wallet && wallet.connected ? (
        // Show wallet connected status and disconnect button
        <Fragment>
          <li className="py-2 md:py-0 md:ml-4">
            <Link 
              to="/dashboard" 
              className="flex items-center px-5 py-2.5 rounded-xl text-gray-200 border border-green-500/20 hover:border-green-500/40 hover:bg-dark-surface/60 backdrop-blur-sm transition-all duration-300 group"
              onMouseEnter={() => handleHover('dashboard')}
              onMouseLeave={handleHoverExit}
            >
              <RiDashboardLine className="mr-2 text-green-500 group-hover:animate-pulse" />
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>
          </li>
          <li className="py-2 md:py-0 md:ml-3">
            <button
              className="flex items-center bg-gradient-to-r from-red-500/80 to-red-600/80 text-white px-5 py-2.5 rounded-xl hover:shadow-glow-lg transition-all duration-300 font-medium relative overflow-hidden group"
              onClick={disconnectWallet}
              onMouseEnter={() => handleHover('disconnect')}
              onMouseLeave={handleHoverExit}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 animate-pulse-slow opacity-30"></div>
              <FaSignOutAlt className="mr-2 group-hover:animate-pulse" /> 
              <span>Disconnect Wallet</span>
            </button>
          </li>
        </Fragment>
      ) : (
        // Show regular guest links when no wallet is connected
        <Fragment>
          <li className="py-2 md:py-0 md:ml-4">
            <Link 
              to="/register" 
              className="flex items-center px-5 py-2.5 rounded-xl text-gray-200 border border-neon-purple/20 hover:border-neon-purple/40 hover:bg-dark-surface/60 backdrop-blur-sm transition-all duration-300 group"
              onMouseEnter={() => handleHover('register')}
              onMouseLeave={handleHoverExit}
            >
              <HiOutlineSparkles className="mr-2 text-neon-purple group-hover:animate-spin-slow" />
              <span className="font-medium">Register</span>
            </Link>
          </li>
          <li className="py-2 md:py-0 md:ml-3">
            <Link 
              to="/login" 
              className="flex items-center px-5 py-2.5 rounded-xl text-gray-200 border border-neon-blue/20 hover:border-neon-blue/40 hover:bg-dark-surface/60 backdrop-blur-sm transition-all duration-300 group"
              onMouseEnter={() => handleHover('login')}
              onMouseLeave={handleHoverExit}
            >
              <IoFlash className="mr-2 text-neon-blue group-hover:animate-pulse" />
              <span className="font-medium">Login</span>
            </Link>
          </li>
          <li className="py-2 md:py-0 md:ml-3">
            {wallet ? (
              <button
                className="flex items-center bg-gradient-to-r from-green-500/80 to-emerald-600/80 text-white px-5 py-2.5 rounded-xl hover:shadow-glow-lg transition-all duration-300 font-medium relative overflow-hidden group"
                onClick={() => setIsWalletModalOpen(true)}
                onMouseEnter={() => handleHover('wallet')}
                onMouseLeave={handleHoverExit}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-600/20 animate-pulse-slow opacity-30"></div>
                <div className="flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                  <FaWallet className="mr-2 group-hover:animate-pulse" />
                  <span>{wallet.address ? `${wallet.address.substring(0, 4)}...${wallet.address.substring(wallet.address.length - 4)}` : 'Wallet Connected'}</span>
                </div>
              </button>
            ) : (
              <button
                className="flex items-center bg-gradient-to-r from-neon-blue/80 to-neon-purple/80 text-white px-5 py-2.5 rounded-xl hover:shadow-glow-lg transition-all duration-300 font-medium relative overflow-hidden group"
                onClick={() => setIsWalletModalOpen(true)}
                onMouseEnter={() => handleHover('wallet')}
                onMouseLeave={handleHoverExit}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 animate-pulse-slow opacity-30"></div>
                <FaLink className="mr-2 group-hover:animate-pulse" /> 
                <span>Connect Wallet</span>
              </button>
            )}
          </li>
        </Fragment>
      )}
    </Fragment>
  );
  
  const mobileGuestLinks = (
    <Fragment>
      {wallet && wallet.connected ? (
        // Show wallet connected status and disconnect button for mobile
        <Fragment>
          <li className="mb-3">
            <Link 
              to="/dashboard" 
              className="flex items-center px-5 py-3.5 rounded-xl text-gray-200 border border-green-500/20 hover:border-green-500/40 hover:bg-dark-surface/60 backdrop-blur-sm transition-all duration-300 group"
              onMouseEnter={() => handleHover('dashboard-mobile')}
              onMouseLeave={handleHoverExit}
            >
              <RiDashboardLine className="text-xl mr-3 text-green-500 group-hover:animate-pulse" />
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>
          </li>
          <li className="mb-3">
            <Link 
              to="/wallet" 
              className="flex items-center px-5 py-3.5 rounded-xl text-gray-200 border border-green-500/20 hover:border-green-500/40 hover:bg-dark-surface/60 backdrop-blur-sm transition-all duration-300 group"
              onMouseEnter={() => handleHover('wallet-mobile')}
              onMouseLeave={handleHoverExit}
            >
              <FaWallet className="text-xl mr-3 text-green-500 group-hover:animate-pulse" />
              <span className="font-medium">Wallet</span>
            </Link>
          </li>
          <li className="mt-5">
            <button
              className="flex items-center justify-center w-full bg-gradient-to-r from-red-500/80 to-red-600/80 text-white px-5 py-3.5 rounded-xl hover:shadow-glow-lg transition-all duration-300 font-medium relative overflow-hidden group"
              onClick={disconnectWallet}
              onMouseEnter={() => handleHover('disconnect-mobile')}
              onMouseLeave={handleHoverExit}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 animate-pulse-slow opacity-30"></div>
              <FaSignOutAlt className="text-xl mr-3 group-hover:animate-pulse" /> 
              <span>Disconnect Wallet</span>
            </button>
          </li>
        </Fragment>
      ) : (
        // Show regular guest links when no wallet is connected
        <Fragment>
          <li className="mb-3">
            <Link 
              to="/register" 
              className="flex items-center px-5 py-3.5 rounded-xl text-gray-200 border border-neon-purple/20 hover:border-neon-purple/40 hover:bg-dark-surface/60 backdrop-blur-sm transition-all duration-300 group"
              onMouseEnter={() => handleHover('register-mobile')}
              onMouseLeave={handleHoverExit}
            >
              <HiOutlineSparkles className="text-xl mr-3 text-neon-purple group-hover:animate-spin-slow" />
              <span className="font-medium">Register</span>
            </Link>
          </li>
          <li className="mb-3">
            <Link 
              to="/login" 
              className="flex items-center px-5 py-3.5 rounded-xl text-gray-200 border border-neon-blue/20 hover:border-neon-blue/40 hover:bg-dark-surface/60 backdrop-blur-sm transition-all duration-300 group"
              onMouseEnter={() => handleHover('login-mobile')}
              onMouseLeave={handleHoverExit}
            >
              <IoFlash className="text-xl mr-3 text-neon-blue group-hover:animate-pulse" />
              <span className="font-medium">Login</span>
            </Link>
          </li>
          <li className="mt-5">
            <button
              className="flex items-center justify-center w-full bg-gradient-to-r from-neon-blue/80 to-neon-purple/80 text-white px-5 py-3.5 rounded-xl hover:shadow-glow-lg transition-all duration-300 font-medium relative overflow-hidden group"
              onClick={() => setIsWalletModalOpen(true)}
              onMouseEnter={() => handleHover('wallet-mobile')}
              onMouseLeave={handleHoverExit}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 animate-pulse-slow opacity-30"></div>
              <FaLink className="text-xl mr-3 group-hover:animate-pulse" /> 
              <span>Connect Wallet</span>
            </button>
          </li>
        </Fragment>
      )}
    </Fragment>
  );

  return (
    <>
      {isWalletModalOpen && (
        <ConnectWalletModal 
          onClose={() => setIsWalletModalOpen(false)}
          onConnect={(walletData) => {
            if (setWallet) {
              setWallet(walletData);
            }
            setIsWalletModalOpen(false);
          }}
        />
      )}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled 
        ? 'bg-dark-surface/80 backdrop-blur-lg shadow-glow-sm border-b border-neon-blue/10' 
        : 'bg-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4 relative">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 opacity-30"></div>
            <Link to="/" className="text-2xl font-bold flex items-center relative z-10">
              <div className="relative">
                <span className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-3 py-1.5 rounded-xl mr-1.5 shadow-glow-sm relative overflow-hidden group-hover:shadow-glow-md transition-all duration-300">
                  <span className="relative z-10">Eaze</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 animate-pulse-slow opacity-50"></div>
                </span>
                <span className="text-white font-clash-display">Fi</span>
              </div>
              <HiChip className="ml-2 text-neon-blue animate-pulse-slow" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center relative z-10">
              {isAuthenticated && wallet && (
                <div className="mr-6 bg-gradient-to-r from-dark-surface to-dark-surface/80 px-4 py-2 rounded-xl flex items-center border border-neon-blue/30 shadow-glow-sm backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 opacity-30"></div>
                  <FaWallet className="text-neon-blue mr-2 group-hover:animate-pulse relative z-10" />
                  <span className="font-bold text-white relative z-10">{wallet.balance}</span> 
                  <span className="text-gray-400 ml-1 relative z-10">{wallet.currency}</span>
                </div>
              )}
              <ul className="flex items-center">
                {isAuthenticated ? authLinks : guestLinks}
              </ul>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center relative z-10">
              {isAuthenticated && wallet && (
                <div className="mr-4 bg-gradient-to-r from-dark-surface to-dark-surface/80 px-3 py-1.5 rounded-xl flex items-center border border-neon-blue/20 shadow-glow-sm backdrop-blur-md">
                  <FaWallet className="text-neon-blue mr-1.5 text-sm animate-pulse-slow" />
                  <span className="font-bold text-sm text-white">{wallet.balance}</span> 
                  <span className="text-gray-400 ml-0.5 text-sm">{wallet.currency}</span>
                </div>
              )}
              <button
                onClick={toggleMenu}
                className="p-2.5 rounded-xl text-white border border-neon-blue/30 hover:border-neon-purple/50 hover:shadow-glow-sm backdrop-blur-md transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 opacity-30"></div>
                {isMenuOpen ? (
                  <FaTimes className="h-6 w-6 relative z-10 text-neon-purple group-hover:animate-spin-slow" />
                ) : (
                  <FaBars className="h-6 w-6 relative z-10 text-neon-blue group-hover:animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-dark-surface/95 backdrop-blur-xl absolute left-0 right-0 z-50 border-t border-neon-blue/10 shadow-glow-md max-h-[80vh] overflow-y-auto transition-all duration-500 animate-slide-down">
            <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/5 to-neon-purple/5 opacity-30"></div>
            <div className="container mx-auto px-4 py-6 relative z-10">
              <ul className="flex flex-col">
                {isAuthenticated ? mobileAuthLinks : mobileGuestLinks}
              </ul>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
