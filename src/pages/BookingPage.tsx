import React, { useState, useEffect, useMemo } from "react";
import { useBooking } from "../context/BookingContext";
import { supabase } from "../lib/supabaseClient";
import { Service, Professional } from "../types";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons";

const BookingPage: React.FC = () => {
  const { booking, setService, setProfessional, setDateTime } = useBooking();
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
    if (booking.service && selectedDay) {
      const fetchSlots = async () => {
        setLoading(prev => ({ ...prev, slots: true }));
        setAvailableSlots([]);
        
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
        const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        try {
          const { data, error } = await supabase.functions.invoke('get-available-slots', {
            body: { 
              serviceId: booking.service.id,
              professionalId: booking.professional?.id,
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
  }, [booking.service, booking.professional, selectedDay, currentDate]);

  // Lógica de navegación entre pasos y selección
  const handleNextStep = () => {
    if (step === 1 && booking.service) setStep(2);
    else if (step === 2 && booking.professional !== undefined) setStep(3);
  };
  const handlePrevStep = () => setStep(prev => prev - 1);
  
  const handleServiceSelect = (service: Service) => {
    setService(service);
    setStep(2);
  };
  const handleProfessionalSelect = (professional: Professional | null) => {
    setProfessional(professional);
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
  const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(), [currentDate]);
  
  const renderCalendar = () => {
    // ... (Tu lógica de calendario aquí, es correcta)
    const blanks = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
        <div className="grid grid-cols-7 gap-2 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="font-bold">{d}</div>)}
            {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
            {days.map(day => (
                <button key={day} onClick={() => setSelectedDay(day)} className={`p-2 rounded-full ${selectedDay === day ? 'bg-primary text-white' : ''}`}>
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
        <div>
          <h2 className="text-xl font-semibold mb-2">Paso 1: Selecciona un Servicio</h2>
          {loading.services ? <p>Cargando servicios...</p> : 
            services.map(s => <button key={s.id} onClick={() => handleServiceSelect(s)}>{s.name}</button>)
          }
        </div>
      )}

      {step === 2 && (
        <div>
          <button onClick={handlePrevStep}>&larr; Volver</button>
          <h2 className="text-xl font-semibold mb-2">Paso 2: Selecciona Profesional</h2>
          <p>Servicio: {booking.service?.name}</p>
          <button onClick={() => handleProfessionalSelect(null)}>Indiferente</button>
          {loading.professionals ? <p>Cargando...</p> :
            professionals.map(p => <button key={p.id} onClick={() => handleProfessionalSelect(p)}>{p.name}</button>)
          }
        </div>
      )}

      {step === 3 && (
        <div>
          <button onClick={handlePrevStep}>&larr; Volver</button>
          <h2 className="text-xl font-semibold mb-2">Paso 3: Elige Fecha y Hora</h2>
          <div className="flex justify-between items-center my-4">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeftIcon /></button>
              <span>{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRightIcon /></button>
          </div>
          {renderCalendar()}
          
          {selectedDay && (
            <div className="mt-4">
                <h3 className="font-semibold">Horas disponibles para el {selectedDay}:</h3>
                {loading.slots ? <p>Buscando huecos...</p> : 
                    availableSlots.map(time => <button key={time} onClick={() => handleTimeSelect(time)}>{time}</button>)
                }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingPage;

