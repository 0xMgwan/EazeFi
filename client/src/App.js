import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import PrivateRoute from './components/routing/PrivateRoute';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Alert from './components/layout/Alert';

// Auth Pages
import Register from './components/auth/Register';
import Login from './components/auth/Login';

// Dashboard Pages
import Dashboard from './components/dashboard/Dashboard';
import Wallet from './components/wallet/Wallet';
import SendMoney from './components/remittance/SendMoney';
import Remittances from './components/remittance/Remittances';
import RemittanceDetails from './components/remittance/RemittanceDetails';
import FamilyPool from './components/family/FamilyPool';
import CreatePool from './components/family/CreatePool';
import Profile from './components/profile/Profile';
import SwapPage from './pages/SwapPage';

// Public Pages
import Home from './components/pages/Home';
import About from './components/pages/About';
import NotFound from './components/pages/NotFound';

// Styles
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <Alert />
            <main className="flex-grow container mx-auto px-4 py-6">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Private Routes */}
                <Route 
                  path="/dashboard" 
                  element={<PrivateRoute component={Dashboard} />} 
                />
                <Route 
                  path="/wallet" 
                  element={<PrivateRoute component={Wallet} />} 
                />
                <Route 
                  path="/send-money" 
                  element={<PrivateRoute component={SendMoney} />} 
                />
                <Route 
                  path="/remittances" 
                  element={<PrivateRoute component={Remittances} />} 
                />
                <Route 
                  path="/remittances/:id" 
                  element={<PrivateRoute component={RemittanceDetails} />} 
                />
                <Route 
                  path="/family-pool" 
                  element={<PrivateRoute component={FamilyPool} />} 
                />
                <Route 
                  path="/family-pool/create" 
                  element={<PrivateRoute component={CreatePool} />} 
                />
                <Route 
                  path="/profile" 
                  element={<PrivateRoute component={Profile} />} 
                />
                <Route 
                  path="/swap" 
                  element={<PrivateRoute component={SwapPage} />} 
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;
