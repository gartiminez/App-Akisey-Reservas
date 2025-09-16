import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SignUpData } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Para controlar si mostramos el formulario de login o de registro
type AuthMode = 'login' | 'register';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  // Obtenemos las funciones de signIn y signUp de nuestro contexto
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Estados para todos los campos de los formularios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Estados para la UI (carga y errores)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función unificada que se encarga de la acción principal
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        // Si estamos en modo login, llamamos a signIn
        await signIn(email, password);
        onClose(); // Cerramos el modal si el login es exitoso
      } else {
        // Si estamos en modo registro, llamamos a signUp
        const signUpData: SignUpData = { email, password, fullName, phone };
        await signUp(signUpData);
        alert('¡Registro completado! Revisa tu email para confirmar tu cuenta y poder iniciar sesión.');
        setMode('login'); // Cambiamos al modo login para que el usuario pueda acceder
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-secondary mb-2">
          {mode === 'login' ? 'Acceso de Cliente' : 'Crea tu Cuenta'}
        </h2>
        <p className="text-center text-light-text mb-6">
          {mode === 'login' ? 'Introduce tus datos para acceder.' : 'Rellena tus datos para registrarte.'}
        </p>
        
        <form onSubmit={handleAuthAction} className="space-y-4">
          {/* Campos adicionales que solo aparecen en modo registro */}
          {mode === 'register' && (
            <>
              <input type="text" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 border rounded-lg" />
              <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-3 border rounded-lg" />
            </>
          )}
          
          {/* Campos comunes para ambos modos */}
          <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border rounded-lg" />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border rounded-lg" />
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light disabled:bg-gray-400 disabled:cursor-not-allowed">
            {loading ? 'Cargando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>

        {/* Botón para cambiar entre modos */}
        <div className="text-center mt-4">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-primary hover:underline">
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
        
        <div className="text-center mt-4">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

