import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { Client, SignUpData } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  clientProfile: Client | null;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<Session | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [clientProfile, setClientProfile] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('clients')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching client profile:', error);
          } else {
            setClientProfile(data as Client | null);
          }
        });
    } else {
      setClientProfile(null);
    }
  }, [user]);

  const signUp = async (signUpData: SignUpData): Promise<User | null> => {
    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user created");
    
    // 2. Crear el perfil en nuestra tabla `clients`
    const { error: profileError } = await supabase.from('clients').insert({
      id: authData.user.id, // Vinculamos el perfil al usuario
      full_name: signUpData.fullName,
      phone: signUpData.phone,
      email: authData.user.email,
    });

    if (profileError) {
      // Opcional: Si falla la creación del perfil, podríamos borrar el usuario de auth
      // para mantener la consistencia. Por ahora, solo lanzamos el error.
      throw profileError;
    }

    return authData.user;
  };
  
  const signIn = async (email: string, password: string): Promise<Session | null> => {
     const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.session;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = { session, user, clientProfile, isLoading, signUp, signIn, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

