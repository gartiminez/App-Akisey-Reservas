import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Promotion, Service } from "../types"; // Asumiendo que Promotion está en tus tipos

const HomePage = () => {
  // --- Estados para datos reales de Supabase ---
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Efecto para cargar los datos desde Supabase ---
  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoading(true);

      // Petición para obtener las promociones activas
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true) // Solo traemos las que están activas
        .limit(3); // Mostramos un máximo de 3

      if (promotionsError) {
        console.error("Error fetching promotions:", promotionsError);
      } else {
        setPromotions(promotionsData);
      }

      // Petición para obtener algunos servicios destacados
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .limit(4); // Mostramos un máximo de 4

      if (servicesError) {
        console.error("Error fetching services:", servicesError);
      } else {
        setServices(servicesData);
      }

      setLoading(false);
    };

    fetchHomePageData();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Cargando...</div>;
  }

  return (
    <div>
      {/* Sección de Bienvenida y Promociones */}
      <section className="bg-primary-light text-center py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
          Tu momento de bienestar empieza aquí
        </h1>
        <p className="text-lg text-light-text max-w-2xl mx-auto mb-8">
          Reserva tu cita de forma fácil y rápida. Descubre nuestros tratamientos y déjate cuidar por las mejores manos.
        </p>
        <Link 
          to="/reservar" 
          className="bg-primary text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-primary-light transition-transform transform hover:scale-105"
        >
          Reservar Cita Ahora
        </Link>
      </section>

      {/* Renderizado de Promociones desde Supabase */}
      {promotions.length > 0 && (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-8">Promociones Especiales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {promotions.map(promo => (
                        <div key={promo.id} className="border rounded-lg shadow-lg overflow-hidden">
                            <img src={promo.image_url || `https://placehold.co/600x400/f472b6/ffffff?text=${promo.title}`} alt={promo.title} className="w-full h-48 object-cover" />
                            <div className="p-6">
                                <h3 className="text-xl font-bold">{promo.title}</h3>
                                <p className="text-gray-600 mt-2">{promo.description}</p>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold text-primary">{promo.promo_price}€</span>
                                    {promo.original_price && <span className="ml-2 text-gray-500 line-through">{promo.original_price}€</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Renderizado de Servicios desde Supabase */}
      {services.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Algunos de Nuestros Servicios</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {services.map(service => (
                <div key={service.id} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-semibold">{service.name}</h3>
                </div>
              ))}
            </div>
             <div className="text-center mt-8">
                <Link to="/servicios" className="text-primary font-semibold hover:underline">
                    Ver todos los servicios &rarr;
                </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
