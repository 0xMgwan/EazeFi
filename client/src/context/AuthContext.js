import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error loading user:', err.response?.data || err.message);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthToken(null);
    }

    setLoading(false);
  };

  // Register user
  const register = async (formData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        formData,
        config
      );

      setToken(res.data.token);
      setAuthToken(res.data.token);
      await loadUser();
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.errors || [{ msg: 'Server error' }]);
      setLoading(false);
      return false;
    }
  };

  // Login user
  const login = async (email, password) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        { email, password },
        config
      );

      setToken(res.data.token);
      setAuthToken(res.data.token);
      await loadUser();
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.errors || [{ msg: 'Server error' }]);
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
