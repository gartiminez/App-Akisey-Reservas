
import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_PROMOTIONS, MOCK_SERVICES } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { useNavigate } from 'react-router-dom';
import { Service } from '../types';


const HomePage: React.FC = () => {
    const { setService } = useBooking();
    const navigate = useNavigate();

    const handleBookService = (service: Service) => {
        setService(service);
        navigate('/reservar');
    };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white bg-gray-500">
        <img src="https://picsum.photos/seed/hero/1200/800" alt="Mujer relajándose en un tratamiento de spa" className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
        <div className="relative z-20 p-4">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">Tu Momento de Belleza</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl">
            Reserva tus tratamientos favoritos de forma rápida y sencilla.
          </p>
          <Link to="/reservar" className="mt-8 inline-block bg-primary text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105">
            Reservar Cita Ahora
          </Link>
        </div>
      </section>

      {/* Promotions Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-secondary mb-8">Promociones Destacadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MOCK_PROMOTIONS.map((promo) => (
            <div key={promo.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
                <img src={promo.imageUrl} alt={promo.title} className="w-full md:w-1/3 h-48 md:h-full object-cover" />
                <div className="p-6 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-secondary">{promo.title}</h3>
                    <p className="mt-2 text-light-text">{promo.description}</p>
                    <div className="mt-4 flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-primary">{promo.promoPrice}€</span>
                        <span className="text-lg text-gray-400 line-through">{promo.originalPrice}€</span>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-secondary mb-8">Nuestros Servicios Populares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_SERVICES.slice(0, 3).map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-secondary">{service.name}</h3>
                    <p className="mt-2 text-light-text flex-grow">{service.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-lg font-semibold text-secondary">{service.price}€</span>
                        <span className="text-sm text-gray-500">{service.duration} min</span>
                    </div>
                    <button 
                        onClick={() => handleBookService(service)}
                        className="mt-6 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-light transition-colors"
                    >
                        Reservar
                    </button>
                </div>
            ))}
        </div>
        <div className="text-center mt-8">
            <Link to="/servicios" className="text-primary font-semibold hover:underline">
                Ver todos los servicios
            </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
