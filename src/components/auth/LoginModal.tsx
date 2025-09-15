
import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();

  const handleLogin = () => {
    login();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-secondary mb-2">Acceso de Cliente</h2>
        <p className="text-center text-light-text mb-6">Introduce tu teléfono para recibir un código de acceso.</p>
        
        <div className="space-y-4">
          <input
            type="tel"
            placeholder="Número de teléfono"
            defaultValue="+34600000000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
          >
            Enviar Código
          </button>
        </div>

        <div className="text-center mt-4">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-secondary">
                Cerrar
            </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
            (Esto es una simulación. Haz clic en "Enviar Código" para acceder con un usuario de ejemplo).
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
