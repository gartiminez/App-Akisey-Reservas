import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  // Usamos la nueva función de nuestro contexto de autenticación
  const { loginWithMagicLink } = useAuth();
  
  // Estados para manejar el formulario
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenimos que el formulario recargue la página
    setLoading(true);
    setMessage('');

    try {
      // Llamamos a la función real de Supabase
      await loginWithMagicLink(email);
      setMessage('¡Revisa tu correo! Te hemos enviado un enlace para acceder.');
    } catch (error) {
      console.error("Error en el login:", error);
      setMessage('Hubo un error al enviar el enlace. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-secondary mb-2">Acceso de Cliente</h2>
        
        {/* Si hay un mensaje, lo mostramos. Si no, mostramos el formulario. */}
        {message ? (
            <div className="text-center my-6">
                <p className="font-semibold text-green-700">{message}</p>
            </div>
        ) : (
            <>
                <p className="text-center text-light-text mb-6">Introduce tu email para recibir un enlace de acceso.</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace de Acceso'}
                  </button>
                </form>
            </>
        )}

        <div className="text-center mt-4">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-secondary">
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

