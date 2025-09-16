
import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { UserCircleIcon } from '../icons';

const LoginOrRegisterPrompt: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    return (
        <>
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-2xl mx-auto text-center">
                <UserCircleIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-secondary mb-2">Casi hemos terminado</h2>
                <p className="text-light-text mb-6">
                    Para finalizar tu reserva, por favor, inicia sesión o crea una cuenta.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => setIsLoginOpen(true)}
                        className="w-full sm:w-auto bg-primary text-white py-3 px-8 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => setIsRegisterOpen(true)}
                        className="w-full sm:w-auto bg-secondary text-white py-3 px-8 rounded-lg font-semibold hover:bg-opacity-90 transition-transform transform hover:scale-105"
                    >
                        Registrarse
                    </button>
                </div>
            </div>
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
        </>
    );
};

export default LoginOrRegisterPrompt;
