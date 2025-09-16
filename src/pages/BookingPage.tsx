import React, { useState, useEffect } from "react";
import { useBooking } from "../context/BookingContext";
import { supabase } from "../lib/supabaseClient";
import { Service, Professional } from "../types";
import { useNavigate } from "react-router-dom";
// ¡Ya no importamos de mockData!

// Placeholder para los iconos
const ChevronLeftIcon = () => <span>&lt;</span>;
const ChevronRightIcon = () => <span>&gt;</span>;


const BookingPage: React.FC = () => {
  const { booking, setService, setProfessional, setDateTime } = useBooking();
  const navigate = useNavigate();

  // --- Estados para datos reales de Supabase ---
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estado para la UI del calendario ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // 1. OBTENER SERVICIOS Y PROFESIONALES AL CARGAR
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
      if (servicesError) console.error("Error fetching services", servicesError);
      else setServices(servicesData);

      const { data: professionalsData, error: professionalsError } = await supabase.from('professionals').select('*');
      if (professionalsError) console.error("Error fetching professionals", professionalsError);
      else setProfessionals(professionalsData);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  // 2. OBTENER HUECOS DISPONIBLES CUANDO CAMBIA LA SELECCIÓN
  useEffect(() => {
    if (booking.service && selectedDay) {
      const fetchSlots = async () => {
        setAvailableSlots([]); // Limpiar huecos anteriores
        try {
          // LLAMADA A LA EDGE FUNCTION DE SUPABASE
          const { data, error } = await supabase.functions.invoke('get-available-slots', {
            body: { 
              serviceId: booking.service.id,
              professionalId: booking.professional?.id, // Puede ser null si es 'Indiferente'
              date: selectedDay.toISOString().split('T')[0] // Formato YYYY-MM-DD
            },
          });

          if (error) throw error;
          setAvailableSlots(data.slots || []);

        } catch (error) {
          console.error('Error fetching available slots:', error);
          // Aquí podrías mostrar un error al usuario
        }
      };
      fetchSlots();
    }
  }, [booking.service, booking.professional, selectedDay]);


  // --- Lógica de renderizado del calendario (sin cambios) ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // --- Handlers ---
  const handleServiceSelect = (serviceId: number) => {
    const selected = services.find(s => s.id === serviceId);
    if (selected) setService(selected);
  };
  
  const handleProfessionalSelect = (professionalId: string | null) => {
    if (professionalId === null) {
      setProfessional(null);
    } else {
      const selected = professionals.find(p => p.id === professionalId);
      if (selected) setProfessional(selected);
    }
  };

  const handleDateSelect = (day: number) => {
    const newSelectedDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(newSelectedDay);
  }

  const handleTimeSelect = (time: string) => {
    if (selectedDay) {
      const [hours, minutes] = time.split(':').map(Number);
      const finalDate = new Date(selectedDay);
      finalDate.setHours(hours, minutes);
      setDateTime(finalDate);
      // Aquí iría la navegación a la página de confirmación
      alert(`Cita seleccionada: ${finalDate.toLocaleString()}`);
    }
  }


  if (loading) return <div>Cargando...</div>;

  // --- Renderizado del componente ---
  // El JSX se mantiene muy similar, pero ahora se alimenta de los estados
  // que vienen de Supabase. Esta es una versión simplificada.
  return (
    <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Reservar Cita</h1>

        {/* PASO 1: SELECCIONAR SERVICIO */}
        <div>
            <h2 className="text-xl font-semibold mb-2">1. Selecciona un Servicio</h2>
            <div className="flex flex-wrap gap-2">
                {services.map(s => (
                    <button key={s.id} onClick={() => handleServiceSelect(s.id)} 
                    className={`p-2 border rounded ${booking.service?.id === s.id ? 'bg-primary text-white' : ''}`}>
                        {s.name}
                    </button>
                ))}
            </div>
        </div>

        {/* PASO 2: SELECCIONAR PROFESIONAL (si hay servicio) */}
        {booking.service && (
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">2. Selecciona Profesional</h2>
                 <button onClick={() => handleProfessionalSelect(null)} className={`p-2 border rounded ${booking.professional === null ? 'bg-primary text-white' : ''}`}>
                    Indiferente
                </button>
                {/* Aquí filtrarías las profesionales que pueden hacer el servicio */}
                {professionals.map(p => (
                    <button key={p.id} onClick={() => handleProfessionalSelect(p.id)}
                    className={`p-2 border rounded ${booking.professional?.id === p.id ? 'bg-primary text-white' : ''}`}>
                        {p.name}
                    </button>
                ))}
            </div>
        )}
        
        {/* PASO 3: SELECCIONAR FECHA Y HORA (si hay servicio) */}
        {booking.service && (
            <div className="mt-6">
                 <h2 className="text-xl font-semibold mb-2">3. Selecciona Fecha y Hora</h2>
                 {/* Aquí iría tu calendario completo */}
                 <p>Calendario para {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</p>
                 <button onClick={() => handleDateSelect(20)}>Seleccionar día 20 (prueba)</button>

                 {selectedDay && (
                    <div className="mt-4">
                        <h3 className="font-semibold">Horas disponibles para {selectedDay.toLocaleDateString()}:</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {availableSlots.length > 0 ? (
                                availableSlots.map(time => (
                                    <button key={time} onClick={() => handleTimeSelect(time)} className="p-2 bg-green-500 text-white rounded">
                                        {time}
                                    </button>
                                ))
                            ) : <p>No hay huecos disponibles para este día.</p>}
                        </div>
                    </div>
                 )}
            </div>
        )}
    </div>
  );
};

export default BookingPage;
