import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole, User as AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  authUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  isAdmin: boolean;
  isCooperativeUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser: User) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setSession(session);
        setAuthUser(session.user);
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      }

      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      (async () => {
        if (session?.user) {
          setSession(session);
          setAuthUser(session.user);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const profile = await fetchUserProfile(session.user);
            setUser(profile);
          }
        } else {
          setSession(null);
          setAuthUser(null);
          setUser(null);
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole = 'cooperative_user') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role }
        }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: 'Failed to create user profile' };
        }
      }

      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    session,
    authUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAdmin: user?.role === 'admin',
    isCooperativeUser: user?.role === 'cooperative_user',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
