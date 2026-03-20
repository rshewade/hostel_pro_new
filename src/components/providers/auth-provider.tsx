'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { authClient } from '@/lib/auth/client';

type AuthContextType = typeof authClient;

const AuthContext = createContext<AuthContextType>(authClient);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={authClient}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
