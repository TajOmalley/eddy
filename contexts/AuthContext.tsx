'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth } from '../lib/firebase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const auth = await getAuth();
      if (!auth) {
        setLoading(false);
        return;
      }
      
      const { onAuthStateChanged } = await import('firebase/auth');
      const unsubscribe = onAuthStateChanged(auth, (user: any) => {
        setUser(user);
        setLoading(false);
      });

      return unsubscribe;
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = await getAuth();
    if (!auth) throw new Error('Firebase not initialized');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const auth = await getAuth();
    if (!auth) throw new Error('Firebase not initialized');
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const auth = await getAuth();
    if (!auth) throw new Error('Firebase not initialized');
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
