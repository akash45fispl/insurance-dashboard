'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from './types';
import { SEED_USERS } from './seed';
import { supabase, isSupabaseConfigured } from './supabase';
import { saveUser } from './data-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  switchRole: (role: Role) => void;
  isAdmin: boolean;
}

const AUTH_STORAGE_KEY = 'fortune_active_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
                role: email.toLowerCase().includes('admin') ? 'admin' : 'advisor',
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

      // Check specific Admin credentials: Admin@fortuneinvestment.in / Evolve@26
      if (cleanEmail === 'admin@fortuneinvestment.in') {
        if (password && password !== 'Evolve@26') {
          return { success: false, error: 'Incorrect Admin Password. Password is Evolve@26' };
        }
        const adminUser: User = {
          id: 'usr_admin_fortune',
          email: 'Admin@fortuneinvestment.in',
          name: 'Fortune Admin',
          role: 'admin',
        };
        setUser(adminUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        return { success: true };
      }

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
          const supUser: User = {
            id: data.session.user.id,
            email: data.session.user.email || cleanEmail,
            name: (data.session.user.email || cleanEmail).split('@')[0],
            role: cleanEmail.includes('admin') ? 'admin' : 'advisor',
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          setUser(supUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(supUser));
          saveUser(supUser);
          return { success: true };
        }
      }

      // Fallback for local dev without Supabase: check users in localStorage database
      let storedUsers: User[] = [];
      try {
        const local = localStorage.getItem('fortune_users_db');
        if (local) storedUsers = JSON.parse(local);
      } catch (err) {}

      const allUsers = [...storedUsers, ...SEED_USERS];
      const found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      if (found) {
        if (found.status === 'inactive') {
          return { 
            success: false, 
            error: 'Account Deactivated: This user account is set to Inactive. Please contact Admin@fortuneinvestment.in to activate access.' 
          };
        }
        setUser(found);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
        saveUser(found);
        return { success: true };
      }

      const customUser: User = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: cleanEmail.includes('admin') ? 'admin' : 'advisor',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setUser(customUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(customUser));
      saveUser(customUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
          },
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      // Demo / fallback Google Sign-In
      const googleUser: User = {
        id: `usr_google_${Date.now()}`,
        email: 'advisor.google@fortuneinvestment.in',
        name: 'Google Advisor',
        role: 'advisor',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setUser(googleUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
      saveUser(googleUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google authentication failed' };
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
        loginWithGoogle,
        logout,
        resetPassword,
        switchRole,
        isAdmin: user?.role === 'admin',
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
