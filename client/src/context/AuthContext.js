import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  // Load user
  const loadUser = async () => {
    if (token) {
      setAuthToken(token);
    }

    try {
      // For testnet, we'll use mock data instead of API call
      if (token && token.startsWith('mock_token_')) {
        // If we already have user data, keep it
        if (!user) {
          // Generate mock user data
          const mockUser = {
            id: 'user_' + Math.random().toString(36).substring(2, 10),
            name: 'Test User',
            email: 'testuser@example.com',
            phone: '+1234567890',
            country: 'United States',
            createdAt: new Date().toISOString()
          };
          setUser(mockUser);
        }
        setIsAuthenticated(true);
      } else {
        // Clear user data if token is invalid
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthToken(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthToken(null);
    }

    setLoading(false);
  };

  // Register user
  const register = async (formData) => {
    // Using mock data for testnet instead of real API calls
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock token
      const mockToken = 'mock_token_' + Math.random().toString(36).substring(2, 15);
      
      // Mock user data
      const mockUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 10),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        nationalId: formData.nationalId,
        createdAt: new Date().toISOString()
      };
      
      // Set token and user data
      setToken(mockToken);
      setAuthToken(mockToken);
      setUser(mockUser);
      setIsAuthenticated(true);
      setError(null);
      setLoading(false);
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError([{ msg: 'Registration failed. Please try again.' }]);
      setLoading(false);
      return false;
    }
  };

  // Login user
  const login = async (email, password) => {
    // Using mock data for testnet
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation
      if (!email || !password) {
        setError([{ msg: 'Please enter all fields' }]);
        setLoading(false);
        return false;
      }
      
      // Generate mock token
      const mockToken = 'mock_token_' + Math.random().toString(36).substring(2, 15);
      
      // Mock user data
      const mockUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 10),
        name: email.split('@')[0],
        email: email,
        phone: '+1234567890',
        country: 'United States',
        createdAt: new Date().toISOString()
      };
      
      // Set token and user data
      setToken(mockToken);
      setAuthToken(mockToken);
      setUser(mockUser);
      setIsAuthenticated(true);
      setError(null);
      setLoading(false);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError([{ msg: 'Invalid credentials' }]);
      setLoading(false);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
  };

  // Update user profile
  const updateProfile = async (formData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${user.id}`,
        formData,
        config
      );

      setUser(res.data);
      setError(null);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.errors || [{ msg: 'Server error' }]);
      setLoading(false);
      return false;
    }
  };

  // Add payment method
  const addPaymentMethod = async (paymentData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${user.id}/payment-method`,
        paymentData,
        config
      );

      // Update user's payment methods
      setUser({ ...user, paymentMethods: res.data });
      setError(null);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.errors || [{ msg: 'Server error' }]);
      setLoading(false);
      return false;
    }
  };

  // Clear errors
  const clearErrors = () => setError(null);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        loading,
        user,
        error,
        register,
        login,
        logout,
        loadUser,
        updateProfile,
        addPaymentMethod,
        clearErrors
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
