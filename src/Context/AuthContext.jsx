import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); 
    });

    // Listen for auth state changes (e.g., login, logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Clean up the listener on unmount
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUpUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      return { data };
    } catch {
      return { error: 'Unexpected error during sign up.' };
    }
  };

  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { data };
    } catch {
      return { error: 'Unexpected error during sign in.' };
    }
  };

  const signOutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return !error;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null, // NEW: expose current user directly
        loading, // NEW: loading status
        signUpUser,
        signInUser,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UseAuth = () => useContext(AuthContext);
