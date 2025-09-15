
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-white mt-16 pb-24 md:pb-0">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold">Belleza<span className="text-primary">Sana</span></h3>
            <p className="mt-2 text-gray-400">Tu oasis de bienestar y belleza.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Contacto</h4>
            <ul className="mt-2 space-y-1 text-gray-400">
              <li><p>Calle Ficticia 123, 28080 Madrid</p></li>
              <li><p>+34 910 000 000</p></li>
              <li><p>contacto@bellezasana.es</p></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Horario</h4>
            <ul className="mt-2 space-y-1 text-gray-400">
              <li><p>Lunes a Viernes: 9:00 - 20:00</p></li>
              <li><p>Sábados: 10:00 - 14:00</p></li>
              <li><p>Domingos: Cerrado</p></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} BellezaSana. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
