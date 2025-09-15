import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { Client } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  clientProfile: Client | null;
  isLoading: boolean;
  loginWithOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, token: string) => Promise<any>;
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [clientProfile, setClientProfile] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtenemos la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setIsLoading(false);
      }
    });

    // Escuchamos cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Cuando el usuario cambia, buscamos su perfil en nuestra tabla 'clients'
  useEffect(() => {
    if (user) {
      supabase
        .from('clients')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching client profile:', error);
          } else {
            setClientProfile(data);
          }
        });
    } else {
      setClientProfile(null);
    }
  }, [user]);

  const loginWithOtp = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: `+34${phone}`, // Asume prefijo de España, ajústalo si es necesario
    });
    if (error) throw error;
    return data;
  };

  const verifyOtp = async (phone: string, token: string) => {
     const { data, error } = await supabase.auth.verifyOtp({
      phone: `+34${phone}`,
      token: token,
      type: 'sms'
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    clientProfile,
    isLoading,
    loginWithOtp,
    verifyOtp,
    logout,
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
