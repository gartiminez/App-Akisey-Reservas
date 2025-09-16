import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient'; // Asegúrate de que este archivo exista y sea correcto
import { Client } from '../types';

// 1. DEFINICIÓN DE LA ESTRUCTURA DEL CONTEXTO
// Aquí definimos qué información y funciones estarán disponibles en toda la app.
interface AuthContextType {
  session: Session | null;
  user: User | null;
  clientProfile: Client | null; // El perfil de nuestra tabla `clients`
  isLoading: boolean;
  loginWithMagicLink: (email: string) => Promise<void>; // Cambiamos la promesa a void
  logout: () => Promise<void>;
}

// 2. CREACIÓN DEL CONTEXTO
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. PROVEEDOR DEL CONTEXTO (EL COMPONENTE QUE HACE LA MAGIA)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // --- Estados Internos ---
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [clientProfile, setClientProfile] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Efecto para Escuchar Cambios de Autenticación ---
  useEffect(() => {
    // Primero, intentamos obtener la sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false); // Dejamos de cargar una vez tenemos la sesión inicial
    });

    // Luego, nos suscribimos a cualquier cambio futuro (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Limpiamos la suscripción cuando el componente se desmonta para evitar fugas de memoria
    return () => subscription.unsubscribe();
  }, []);

  // --- Efecto para Obtener el Perfil del Cliente ---
  useEffect(() => {
    // Si tenemos un usuario autenticado...
    if (user?.id) {
      // ...buscamos su perfil en nuestra tabla `clients`
      supabase
        .from('clients')
        .select('*')
        .eq('id', user.id) // La clave es que el `id` en `clients` coincida con el `id` del usuario en Supabase
        .single()
        .then(({ data, error }) => {
          // Si hay un error, pero NO es porque no encontró al usuario (PGRST116), lo mostramos
          if (error && error.code !== 'PGRST116') { 
            console.error('Error fetching client profile:', error);
          } else {
            setClientProfile(data as Client | null); // Guardamos el perfil encontrado
          }
        });
    } else {
      // Si no hay usuario, no hay perfil
      setClientProfile(null);
    }
  }, [user]); // Este efecto se ejecuta cada vez que el `user` cambia

  // --- Funciones de Autenticación ---
  const loginWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // CAMBIO CLAVE: Redirigimos a la raíz. Es más robusto.
        // Tu router se encargará de mostrar la página correcta.
        // Asegúrate de que http://localhost:PORT/ (o tu URL de producción)
        // está en la lista de "Redirect URLs" en la configuración de Supabase.
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // --- Valor que proveemos a toda la aplicación ---
  const value = {
    session,
    user,
    clientProfile,
    isLoading,
    loginWithMagicLink,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. HOOK PERSONALIZADO PARA USAR EL CONTEXTO FÁCILMENTE
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

