import React, { useState, useEffect, useMemo } from "react";
import { useBooking } from "../context/BookingContext";
import { supabase } from "../lib/supabaseClient";
import { Service, Professional } from "../types";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons";

const BookingPage: React.FC = () => {
  // CORRECCIÓN: Obtenemos service y professional directamente, no un objeto 'booking'
  const { service, professional, setService, setProfessional, setDateTime } = useBooking();
  const navigate = useNavigate();

  // Estados para datos reales de Supabase
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Estados para la UI
  const [loading, setLoading] = useState({ services: true, professionals: true, slots: false });
  const [step, setStep] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // 1. OBTENER SERVICIOS Y PROFESIONALES AL CARGAR
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(prev => ({ ...prev, services: true, professionals: true }));
      const servicesPromise = supabase.from('services').select('*');
      const professionalsPromise = supabase.from('professionals').select('*');

      const [servicesResponse, professionalsResponse] = await Promise.all([servicesPromise, professionalsPromise]);

      if (servicesResponse.error) console.error("Error fetching services", servicesResponse.error);
      else setServices(servicesResponse.data || []);
      setLoading(prev => ({ ...prev, services: false }));

      if (professionalsResponse.error) console.error("Error fetching professionals", professionalsResponse.error);
      else setProfessionals(professionalsResponse.data || []);
      setLoading(prev => ({ ...prev, professionals: false }));
    };
    fetchInitialData();
  }, []);

  // 2. OBTENER HUECOS DISPONIBLES CUANDO CAMBIA LA SELECCIÓN
  useEffect(() => {
    // CORRECCIÓN: Usamos 'service' directamente
    if (service && selectedDay) {
      const fetchSlots = async () => {
        setLoading(prev => ({ ...prev, slots: true }));
        setAvailableSlots([]);
        
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
        const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        try {
          const { data, error } = await supabase.functions.invoke('get-available-slots', {
            body: { 
              // CORRECCIÓN: Usamos service.id y professional?.id
              serviceId: service.id,
              professionalId: professional?.id,
              date: dateString
            },
          });
          if (error) throw error;
          setAvailableSlots(data.slots || []);
        } catch (error) {
          console.error('Error fetching available slots:', error);
        } finally {
          setLoading(prev => ({ ...prev, slots: false }));
        }
      };
      fetchSlots();
    }
  }, [service, professional, selectedDay, currentDate]); // CORRECCIÓN: Dependencias actualizadas
  
  const handleServiceSelect = (selectedService: Service) => {
    setService(selectedService);
    setStep(2);
  };
  const handleProfessionalSelect = (selectedProfessional: Professional | null) => {
    setProfessional(selectedProfessional);
    setStep(3);
  };
  const handleTimeSelect = (time: string) => {
    if(selectedDay){
      const [hours, minutes] = time.split(':').map(Number);
      const finalDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
      finalDate.setHours(hours, minutes);
      setDateTime(finalDate);
      alert(`Cita seleccionada para: ${finalDate.toLocaleString()}`);
      navigate('/perfil');
    }
  };

  // --- Lógica y renderizado del calendario ---
  const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);
  const firstDayOfMonth = useMemo(() => {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Lunes = 0, Domingo = 6
  }, [currentDate]);
  
  const renderCalendar = () => {
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
        <div className="grid grid-cols-7 gap-2 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="font-bold text-sm text-gray-500">{d}</div>)}
            {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
            {days.map(day => (
                <button key={day} onClick={() => setSelectedDay(day)} className={`p-2 rounded-full transition ${selectedDay === day ? 'bg-primary text-white font-bold' : 'hover:bg-gray-200'}`}>
                    {day}
                </button>
            ))}
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Reservar Cita</h1>
      
      {/* RENDERIZADO DE PASOS */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Paso 1: Selecciona un Servicio</h2>
          {loading.services ? <p>Cargando servicios...</p> : 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map(s => <button key={s.id} onClick={() => handleServiceSelect(s)} className="w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition">{s.name}</button>)}
            </div>
          }
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <button onClick={() => setStep(1)} className="text-sm text-primary mb-4">&larr; Cambiar Servicio</button>
          <h2 className="text-xl font-semibold mb-2">Paso 2: Selecciona Profesional</h2>
          <p className="mb-4">Servicio: <span className="font-semibold">{service?.name}</span></p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleProfessionalSelect(null)} className={`p-3 border rounded-lg transition ${professional === null ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>Indiferente</button>
            {loading.professionals ? <p>Cargando...</p> :
              // Aquí deberías filtrar los profesionales que pueden hacer el servicio
              professionals.map(p => <button key={p.id} onClick={() => handleProfessionalSelect(p)} className={`p-3 border rounded-lg transition ${professional?.id === p.id ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>{p.name}</button>)
            }
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <button onClick={() => setStep(2)} className="text-sm text-primary mb-4">&larr; Cambiar Profesional</button>
          <h2 className="text-xl font-semibold mb-2">Paso 3: Elige Fecha y Hora</h2>
          <div className="flex justify-between items-center my-4">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeftIcon /></button>
              <span className="font-semibold text-lg capitalize">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRightIcon /></button>
          </div>
          {renderCalendar()}
          
          {selectedDay && (
            <div className="mt-6">
                <h3 className="font-semibold text-center mb-2">Horas disponibles para el {selectedDay}</h3>
                {loading.slots ? <p className="text-center">Buscando huecos...</p> : 
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.length > 0 ?
                      availableSlots.map(time => <button key={time} onClick={() => handleTimeSelect(time)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">{time}</button>)
                      : <p className="col-span-4 text-center text-gray-500">No hay huecos para este día.</p>
                    }
                  </div>
                }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingPage;

