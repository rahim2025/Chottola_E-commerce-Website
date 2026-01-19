import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { CartContext } from './CartContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.data);
    
    // Notify CartContext about authentication change
    if (window.updateCartAuthStatus) {
      window.updateCartAuthStatus(true);
    }
    
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.data);
    
    // Notify CartContext about authentication change
    if (window.updateCartAuthStatus) {
      window.updateCartAuthStatus(true);
    }
    
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    
    // Notify CartContext about authentication change
    if (window.updateCartAuthStatus) {
      window.updateCartAuthStatus(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      const newUser = { ...storedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
