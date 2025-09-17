
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Client } from '../types';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: Client | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  register: (details: { email: string; password: string; fullName: string; phone: string; }) => Promise<any>;
  updateUser: (details: { fullName: string; phone: string; email: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
            const { data: clientProfile } = await supabase
                .from('clients')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setUser(clientProfile || null);
        }
        setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: clientProfile, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
          console.error('Error fetching client profile:', error);
        }
        setUser(clientProfile || null);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const login = async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  
  const register = async (details: { email: string; password: string; fullName: string; phone: string; }) => {
    const { data, error } = await supabase.auth.signUp({
      email: details.email,
      password: details.password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("No user returned on signup.");

    // Insert into public.clients table
    const { error: profileError } = await supabase.from('clients').insert({
      id: data.user.id,
      full_name: details.fullName,
      phone: details.phone,
      email: data.user.email,
    });

    if (profileError) {
      // If profile creation fails, we should ideally handle this,
      // e.g., by deleting the auth user, but for now we'll throw.
      throw new Error(`Error creating client profile: ${profileError.message}`);
    }
    
    // The onAuthStateChange listener will handle setting the user state.
    alert('¡Registro completado! Revisa tu correo electrónico para verificar tu cuenta.');
    
    return data;
  };

  const updateUser = async (details: { fullName:string; phone: string; email: string }) => {
    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
      .from('clients')
      .update({ full_name: details.fullName, phone: details.phone, email: details.email })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    setUser(data);
  };

  const value = {
    session,
    user,
    isLoggedIn: !!session,
    loading,
    login,
    logout,
    register,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
