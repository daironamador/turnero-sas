
import React, { createContext, useContext } from 'react';
import useSupabaseAuth from '@/hooks/useSupabaseAuth';

type AuthContextType = {
  session: any | null;
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<boolean>; 
  userRole: string;
  isPersistent: boolean;
  lastRefreshed: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use only Supabase auth hook
  const auth = useSupabaseAuth();

  const value = {
    session: auth.session,
    user: auth.user,
    loading: auth.loading,
    signOut: auth.signOut,
    refreshUser: auth.refreshUser,
    userRole: auth.userRole,
    isPersistent: auth.isPersistent,
    lastRefreshed: auth.lastRefreshed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
