import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useLocalStorage } from '../src/hooks/useLocalStorage';

// (undefined)
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = 'http://localhost:3001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('user', null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const recognizeUser = async (imageData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/recognize`, {
        image: imageData,
      });

      if (response.data.success && response.data.user) {
        const token = response.data.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        setUser(response.data.user);
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Face recognition error:', error);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    recognizeUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
