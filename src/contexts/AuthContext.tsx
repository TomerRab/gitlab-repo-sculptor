import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GitLabCredentials } from '@/types/gitlab';

interface AuthContextType {
  credentials: GitLabCredentials | null;
  setCredentials: (credentials: GitLabCredentials | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [credentials, setCredentials] = useState<GitLabCredentials | null>(null);

  const value = {
    credentials,
    setCredentials,
    isAuthenticated: !!credentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};