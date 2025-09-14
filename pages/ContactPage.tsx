import React from 'react';
import { PhoneIcon, EnvelopeIcon } from '../components/icons';

const ContactPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Contacto y Horario</h1>
        <p className="mt-2 text-lg text-light-text">Estamos aquí para ayudarte. ¡Contáctanos!</p>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6 md:p-10 space-y-8">
        <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">Sobre BellezaSana</h2>
            <p className="text-light-text leading-relaxed">
                BellezaSana es tu santuario personal en el corazón de la ciudad, un lugar donde la belleza, el bienestar y la salud se encuentran. Nuestro equipo de profesionales altamente cualificados se dedica a ofrecerte una experiencia única y personalizada, utilizando los productos más innovadores y las técnicas más avanzadas. Creemos en realzar tu belleza natural y en proporcionarte un momento de paz y desconexión de la rutina diaria. Ven a conocernos y déjate cuidar.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a 
                href="tel:+34910000000" 
                className="flex items-center justify-center space-x-3 bg-primary text-white px-6 py-4 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
            >
                <PhoneIcon className="w-6 h-6" />
                <span>Llamar Ahora</span>
            </a>
            <a 
                href="mailto:contacto@bellezasana.es"
                className="flex items-center justify-center space-x-3 bg-secondary text-white px-6 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition-transform transform hover:scale-105"
            >
                <EnvelopeIcon className="w-6 h-6" />
                <span>Enviar Email</span>
            </a>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">Nuestro Horario</h2>
            <ul className="text-light-text space-y-2 border-l-4 border-primary pl-4">
                <li className="flex justify-between"><span>Lunes a Viernes:</span> <span className="font-semibold text-secondary">9:00 - 20:00</span></li>
                <li className="flex justify-between"><span>Sábados:</span> <span className="font-semibold text-secondary">10:00 - 14:00</span></li>
                <li className="flex justify-between"><span>Domingos:</span> <span className="font-semibold text-secondary">Cerrado</span></li>
            </ul>
        </div>
        
        <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">Ubicación</h2>
             <p className="text-light-text">Calle Ficticia 123, 28080 Madrid</p>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;
