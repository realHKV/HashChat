import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, removeToken, isAuthenticated } from '../utils/auth';
import { userAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          console.log("before login:"+localStorage.getItem('token')) 
          const response = await userAPI.getProfile();
          setUser(response.data);
        } catch (error) {
          removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value = {
    user,
    setUser,
    logout,
    isAuthenticated: isAuthenticated(),
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};