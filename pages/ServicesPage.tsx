
import React, { useState, useMemo } from 'react';
import { MOCK_SERVICES } from '../data/mockData';
import { Service } from '../types';
import { useBooking } from '../context/BookingContext';
import { useNavigate } from 'react-router-dom';

const ServicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const { setService } = useBooking();
  const navigate = useNavigate();

  const categories = useMemo(() => 
    ['Todos', ...new Set(MOCK_SERVICES.map(s => s.category))]
  , []);

  const filteredServices = useMemo(() => {
    return MOCK_SERVICES.filter(service => {
      const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            service.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const handleBookService = (service: Service) => {
    setService(service);
    navigate('/reservar');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Catálogo de Servicios</h1>
        <p className="mt-2 text-lg text-light-text">Encuentra el tratamiento perfecto para ti.</p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-6">
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
        />
        
        <div className="flex space-x-3 overflow-x-auto pb-3 -mx-4 px-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-5 py-2 rounded-full font-semibold text-base whitespace-nowrap transition-colors duration-200 border-2 ${
                selectedCategory === category
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-secondary border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>


      {/* Service List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col transition-transform transform hover:-translate-y-1">
              <span className="text-sm font-semibold text-primary">{service.category}</span>
              <h3 className="text-2xl font-bold text-secondary mt-1">{service.name}</h3>
              <p className="mt-2 text-light-text flex-grow">{service.description}</p>
              <div className="mt-4 flex justify-between items-center text-lg">
                <span className="font-bold text-secondary">{service.price}€</span>
                <span className="font-medium text-light-text">{service.duration} min</span>
              </div>
              <button 
                onClick={() => handleBookService(service)}
                className="mt-6 w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors"
              >
                Reservar
              </button>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-light-text text-lg">No se encontraron servicios que coincidan con tu búsqueda.</p>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
