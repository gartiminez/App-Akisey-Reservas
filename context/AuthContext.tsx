
import React, { createContext, useState, useContext, ReactNode } from 'react';
// FIX: The 'Client' type is defined in '../types' and not exported from mockData.
import { Client } from '../types';
import { MOCK_CLIENT } from '../data/mockData';

interface AuthContextType {
  isLoggedIn: boolean;
  user: Client | null;
  login: () => void;
  logout: () => void;
  register: (details: { fullName: string; phone: string; email: string }) => void;
  updateUser: (details: { fullName: string; phone: string; email: string }) => void;
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
  
  const register = (details: { fullName: string; phone: string; email: string }) => {
    // In a real app, this would create a new user via an API call
    const newUser: Client = {
      id: `user-${Date.now()}`,
      ...details
    };
    setUser(newUser);
    setIsLoggedIn(true);
  };

  const updateUser = (details: { fullName: string; phone: string; email: string }) => {
    // In a real app, this would save the user's data via an API call
    if (user) {
        setUser(currentUser => {
            if (!currentUser) return null;
            // The save button acts as a confirmation for this simulation
            return { ...currentUser, ...details };
        });
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, register, updateUser }}>
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