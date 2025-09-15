import React, { createContext, useState, useContext, ReactNode } from 'react';
// FIX: The 'Client' type is defined in '../types' and not exported from mockData.
import { Client } from '../types';
import { MOCK_CLIENT } from '../data/mockData';

interface AuthContextType {
  isLoggedIn: boolean;
  user: Client | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<Client | null>(null);

  const login = () => {
    // In a real app, this would involve an API call with phone/email
    setUser(MOCK_CLIENT);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
