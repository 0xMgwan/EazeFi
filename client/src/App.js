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
// Remittances page removed as per user request
import RemittanceDetails from './components/remittance/RemittanceDetails';
import FamilyPool from './components/family/FamilyPool';
import CreateFamilyPool from './components/family/CreateFamilyPool';
import Profile from './components/profile/Profile';
import SwapPage from './pages/SwapPage';

// Public Pages
import Landing from './pages/Landing';
import About from './pages/About';
import NotFound from './pages/NotFound';

// Styles
import './App.css';
import './styles/custom.css';

const App = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <Alert />
            <main className="flex-grow container mx-auto px-4 py-6 animate-fade-in">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
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
                  element={<Wallet />} 
                />
                <Route 
                  path="/send-money" 
                  element={<PrivateRoute component={SendMoney} />} 
                />
                                {/* Remittances route removed as per user request */}
                <Route 
                  path="/remittances/:id" 
                  element={<PrivateRoute component={RemittanceDetails} />} 
                />
                <Route 
                  path="/family-pools" 
                  element={<PrivateRoute component={FamilyPool} />} 
                />
                <Route 
                  path="/family-pools/create" 
                  element={<PrivateRoute component={CreateFamilyPool} />} 
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
