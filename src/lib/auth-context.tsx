'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from './types';
import { SEED_USERS } from './seed';
import { supabase, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  switchRole: (role: Role) => void;
  isAdmin: boolean;
  verifyAdminPassword: (password: string) => boolean;
  changeAdminPassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };
  resetAdminPasswordToDefault: () => void;
}

const AUTH_STORAGE_KEY = 'fortune_active_user_session';
const ADMIN_PASSWORD_STORAGE_KEY = 'fortune_admin_switch_password';
const DEFAULT_ADMIN_PASSWORD = 'Evolve@26';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure default admin password is set if not already present
    if (typeof window !== 'undefined' && !localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY)) {
      localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, DEFAULT_ADMIN_PASSWORD);
    }
  }, []);

  const getAdminPassword = (): string => {
    if (typeof window === 'undefined') return DEFAULT_ADMIN_PASSWORD;
    return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
  };

  const verifyAdminPassword = (password: string): boolean => {
    const current = getAdminPassword();
    return password === current;
  };

  const changeAdminPassword = (currentPassword: string, newPassword: string): { success: boolean; error?: string } => {
    if (!verifyAdminPassword(currentPassword)) {
      return { success: false, error: 'Current admin password is incorrect.' };
    }
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters.' };
    }
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, newPassword.trim());
    return { success: true };
  };

  const resetAdminPasswordToDefault = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, DEFAULT_ADMIN_PASSWORD);
    }
  };

  useEffect(() => {
    // Check saved session in localStorage or Supabase
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const email = data.session.user.email || '';
            const match = SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
            setUser(
              match || {
                id: data.session.user.id,
                email,
                name: email.split('@')[0],
                role: 'advisor',
              }
            );
            setLoading(false);
            return;
          }
        }

        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      
      if (isSupabaseConfigured && supabase) {
        if (!password) {
          return { success: false, error: 'Password is required' };
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || cleanEmail,
            name: (data.session.user.email || cleanEmail).split('@')[0],
            role: 'advisor', // or fetch from db
          });
          return { success: true };
        }
      }

      // Fallback for local dev without Supabase
      const found = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
      if (found) {
        setUser(found);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
        return { success: true };
      }

      const customUser: User = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: cleanEmail.includes('admin') ? 'admin' : 'advisor',
      };
      setUser(customUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(customUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: error.message };
    }
    return {
      success: true,
      message: `Password reset instructions have been sent to ${email}. Please check your inbox.`,
    };
  };

  const switchRole = (role: Role) => {
    if (!user) return;
    const updated = { ...user, role };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resetPassword,
        switchRole,
        isAdmin: user?.role === 'admin',
        verifyAdminPassword,
        changeAdminPassword,
        resetAdminPasswordToDefault,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
