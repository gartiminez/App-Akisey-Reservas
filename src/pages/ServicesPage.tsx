import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Service } from '../types';

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        setError('No se pudieron cargar los servicios. Por favor, inténtelo más tarde.');
      } else {
        setServices(data);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Cargando servicios...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Nuestros Servicios</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="border rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold">{service.name}</h2>
            <p className="text-gray-600">{service.category}</p>
            <p className="mt-2">{service.duration} min - <span className="font-bold">{service.price}€</span></p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;
