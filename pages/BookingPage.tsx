
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { Service, Professional, TimeSlot, Appointment } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';
import BookingResultModal from '../components/booking/BookingResultModal';
import { useAuth } from '../context/AuthContext';
import LoginOrRegisterPrompt from '../components/auth/LoginOrRegisterPrompt';
import { supabase } from '../lib/supabaseClient';
// FIX: Switch to named imports from the main 'date-fns' package to resolve "not callable" errors with sub-path imports.
import { addMinutes, format, set, startOfDay, endOfDay } from 'date-fns';


// Helper components defined outside to prevent re-renders
const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const steps = ['Servicio', 'Profesional', 'Fecha y Hora', 'Confirmar'];
    return (
        <div className="flex justify-center items-center space-x-2 md:space-x-4 mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flex items-center">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= index + 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {index + 1}
                        </div>
                        <span className={`ml-2 text-sm md:text-base hidden sm:inline ${currentStep >= index + 1 ? 'text-secondary font-semibold' : 'text-gray-500'}`}>{step}</span>
                    </div>
                    {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200"></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

const BookingPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const { bookingState, setService, setProfessional, setDateTime, resetBooking } = useBooking();
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();
    const isEditMode = useMemo(() => !!bookingState.appointmentToEdit, [bookingState.appointmentToEdit]);
    
    // --- Data state ---
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);

    // --- State for Step 1: Service Selection ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    // --- State for Step 3: Date & Time Selection ---
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);

    // --- State for Result Modal ---
    const [bookingResult, setBookingResult] = useState<{
        isOpen: boolean;
        status: 'success' | 'error';
        message: string;
    }>({ isOpen: false, status: 'success', message: '' });

    // --- Data fetching effect for services ---
    useEffect(() => {
        const fetchServices = async () => {
            const { data, error } = await supabase.from('services').select('*');
            if (error) console.error("Error fetching services", error);
            else setAllServices(data || []);
        };
        fetchServices();
    }, []);

    // --- Memoized values for filtering ---
    const categories = useMemo(() => ['Todos', ...new Set(allServices.map(s => s.category))], [allServices]);
    const filteredServices = useMemo(() => {
        return allServices.filter(service => {
        const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory, allServices]);

    // Effect to manage the current step based on the booking state.
    useEffect(() => {
        if (isEditMode) {
            setCurrentStep(3);
        } else if (bookingState.service) {
            setCurrentStep(2);
        } else {
            setCurrentStep(1);
        }
    }, [isEditMode, bookingState.service]);

    // Effect to fetch professionals when a service is selected
    useEffect(() => {
        if (bookingState.service) {
            const fetchProfessionals = async () => {
                const { data, error } = await supabase
                    .from('professional_skills')
                    .select('professionals(*)')
                    .eq('service_id', bookingState.service!.id);
                
                if (error) console.error("Error fetching professionals", error);
                else {
                    // FIX: The type error indicates that `item.professionals` might be an array, leading to a `Professional[][]`.
                    // We use `.flat()` to handle this possibility. Chaining `?.` prevents runtime errors if `data` is null.
                    const professionals = data?.map(item => item.professionals)?.filter(Boolean)?.flat() as Professional[] || [];
                    setAvailableProfessionals(professionals);
                }
            };
            fetchProfessionals();
        }
    }, [bookingState.service]);

    // Effect to calculate available time slots
    useEffect(() => {
        if (currentStep !== 3 || !bookingState.service) return;

        const calculateSlots = async () => {
            setSlotsLoading(true);
            setAvailableSlots([]);

            const { service, professional } = bookingState;
            const serviceDuration = service.duration + service.break_time;
            
            // Define working hours
            const workingHours = [
                { start: { hour: 9, minute: 0 }, end: { hour: 13, minute: 0 } },
                { start: { hour: 16, minute: 0 }, end: { hour: 20, minute: 0 } }
            ];

            // Fetch appointments for the selected professional and date
            let query = supabase
                .from('appointments')
                .select('start_time, end_time')
                .gte('start_time', startOfDay(selectedDate).toISOString())
                .lt('end_time', endOfDay(selectedDate).toISOString());

            if (professional) {
                query = query.eq('professional_id', professional.id);
            }
            
            const { data: existingAppointments, error } = await query;
            if (error) {
                console.error("Error fetching appointments:", error);
                setSlotsLoading(false);
                return;
            }

            const bookedSlots = existingAppointments.map(a => ({
                start: new Date(a.start_time),
                end: new Date(a.end_time)
            }));

            // Generate potential slots and check availability
            const slots: TimeSlot[] = [];
            workingHours.forEach(period => {
                let currentTime = set(selectedDate, period.start);
                const endTime = set(selectedDate, period.end);

                while (addMinutes(currentTime, serviceDuration) <= endTime) {
                    const slotEnd = addMinutes(currentTime, serviceDuration);
                    
                    const isBooked = bookedSlots.some(bookedSlot => 
                        (currentTime < bookedSlot.end && slotEnd > bookedSlot.start)
                    );

                    slots.push({
                        time: format(currentTime, 'HH:mm'),
                        available: !isBooked,
                    });
                    currentTime = addMinutes(currentTime, 15); // Check every 15 mins for a potential start
                }
            });

            setAvailableSlots(slots);
            setSlotsLoading(false);
        };

        calculateSlots();

    }, [currentStep, selectedDate, bookingState.service, bookingState.professional]);


    const handleSelectService = (service: Service) => {
        setService(service);
        setCurrentStep(2);
    };

    const handleSelectProfessional = (professional: Professional | null) => {
        setProfessional(professional);
        setCurrentStep(3);
    };

    const handleSelectDateTime = (date: Date, time: string) => {
        setDateTime(date, time);
        setCurrentStep(4);
    };

    const handleFinalConfirmBooking = async () => {
        if (!user || !bookingState.service || !bookingState.date || !bookingState.time || !bookingState.professional) {
            setBookingResult({ isOpen: true, status: 'error', message: 'Faltan datos para la reserva.' });
            return;
        }

        const { service, professional, date, time } = bookingState;
        const [hour, minute] = time.split(':').map(Number);
        const startTime = set(date, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
        const endTime = addMinutes(startTime, service.duration);

        const newAppointment = {
            client_id: user.id,
            service_id: service.id,
            professional_id: professional.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'confirmada' as const,
        };

        const { error } = await supabase.from('appointments').insert(newAppointment);
        
        if (error) {
            setBookingResult({ isOpen: true, status: 'error', message: `Error al crear la cita: ${error.message}` });
        } else {
            setBookingResult({ isOpen: true, status: 'success', message: 'Tu cita ha sido confirmada correctamente. ¡Te esperamos!' });
        }
    };
    
    const handleCloseResultModal = () => {
        const status = bookingResult.status;
        setBookingResult({ isOpen: false, status: 'success', message: '' });
        if (status === 'success') {
            resetBooking();
            navigate('/perfil');
        }
    };

    const weekDays = useMemo(() => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (weekOffset * 7));
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [weekOffset]);

    const ServiceStep = () => (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary mb-6 text-center">1. Elige un servicio</h2>
            <div className="mb-6 space-y-4">
                <input
                type="text"
                placeholder="Buscar servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
                <div className="flex space-x-3 overflow-x-auto pb-3 -mx-4 px-4">
                    {categories.map(category => (
                        <button key={category} onClick={() => setSelectedCategory(category)} className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors duration-200 border-2 ${selectedCategory === category ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-gray-300 hover:bg-gray-100'}`}>
                        {category}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredServices.map(service => (
                    <button key={service.id} onClick={() => handleSelectService(service)} className="bg-white p-4 rounded-lg shadow text-left hover:shadow-lg hover:ring-2 hover:ring-primary transition">
                        <h3 className="font-bold text-secondary">{service.name}</h3>
                        <p className="text-sm text-light-text">{service.duration} min</p>
                        <p className="font-semibold text-primary mt-2">{service.price}€</p>
                    </button>
                ))}
            </div>
        </div>
    );
    
    const ProfessionalStep = () => (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-secondary mb-6 text-center">2. Elige un profesional</h2>
                <div className="space-y-4">
                    <button onClick={() => handleSelectProfessional(null)} className={`w-full flex items-center p-4 rounded-lg shadow transition-all border-2 ${bookingState.professional === null ? 'bg-primary/10 border-primary' : 'bg-white hover:shadow-lg'}`}>
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center font-bold text-secondary text-xl mr-4">?</div>
                        <div>
                            <h3 className="font-bold text-secondary text-lg">Cualquier Profesional</h3>
                            <p className="text-sm text-light-text">Te asignaremos el primer profesional disponible.</p>
                        </div>
                    </button>
                    {availableProfessionals.map(prof => (
                        <button key={prof.id} onClick={() => handleSelectProfessional(prof)} className={`w-full flex items-center p-4 rounded-lg shadow transition-all border-2 ${bookingState.professional?.id === prof.id ? 'bg-primary/10 border-primary' : 'bg-white hover:shadow-lg'}`}>
                            <img src={prof.avatar_url} alt={prof.full_name} className="w-16 h-16 rounded-full object-cover mr-4" />
                            <div>
                                <h3 className="font-bold text-secondary text-lg">{prof.full_name}</h3>
                            </div>
                        </button>
                    ))}
                </div>
                 <button onClick={() => setCurrentStep(1)} className="mt-6 text-sm text-light-text hover:underline">Volver a servicios</button>
            </div>
        );

    const DateTimeStep = () => (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary mb-6 text-center">3. Elige fecha y hora</h2>
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled={weekOffset === 0}><ChevronLeftIcon className="w-6 h-6" /></button>
                <span className="font-semibold text-secondary">
                    {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map(day => (
                    <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`p-2 rounded-lg text-center transition ${selectedDate.toDateString() === day.toDateString() ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
                        <span className="text-xs uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                        <span className="block font-bold text-lg">{day.getDate()}</span>
                    </button>
                ))}
            </div>
            {slotsLoading ? <p className="text-center">Buscando horas disponibles...</p> : (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableSlots.filter(s => s.available).map(slot => (
                        <button key={slot.time} onClick={() => handleSelectDateTime(selectedDate, slot.time)} className="px-4 py-3 rounded-lg font-semibold transition bg-secondary text-white hover:bg-primary">
                            {slot.time}
                        </button>
                    ))}
                 </div>
            )}
             <div className="mt-8 flex justify-center">
                 <button onClick={() => setCurrentStep(2)} className="text-sm text-light-text hover:underline">Volver a profesionales</button>
            </div>
        </div>
    );
    
    const ConfirmationStep = () => {
        const { service, professional, date, time } = bookingState;

        if (!isLoggedIn && !isEditMode) return <LoginOrRegisterPrompt />;
        if (!service || !date || !time) return <p>Faltan datos de la reserva.</p>;

        const professionalName = professional?.full_name || 'Cualquier profesional';
        const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-secondary mb-6 text-center">4. Confirma tu reserva</h2>
                <div className="space-y-4 p-4 bg-light-bg rounded-lg border border-gray-200">
                    <div><h3 className="font-semibold text-sm text-light-text">Servicio</h3><p className="text-lg text-secondary">{service.name}</p></div>
                    <div><h3 className="font-semibold text-sm text-light-text">Profesional</h3><p className="text-lg text-secondary">{professionalName}</p></div>
                    <div><h3 className="font-semibold text-sm text-light-text">Fecha y Hora</h3><p className="text-lg text-secondary">{formattedDate} a las {time}</p></div>
                    <div><h3 className="font-semibold text-sm text-light-text">Total</h3><p className="text-xl font-bold text-primary">{service.price}€</p></div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                     <button onClick={handleFinalConfirmBooking} className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105">
                        Confirmar Reserva
                    </button>
                    <button onClick={() => setCurrentStep(3)} className="w-full bg-white text-secondary py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors">
                        Cambiar Hora
                    </button>
                </div>
            </div>
        );
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <ServiceStep />;
            case 2: return <ProfessionalStep />;
            case 3: return <DateTimeStep />;
            case 4: return <ConfirmationStep />;
            default: return <p>Paso desconocido</p>;
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-secondary tracking-tight text-center mb-4">Reservar una Cita</h1>
                 <p className="text-center text-lg text-light-text mb-8">Sigue los pasos para reservar tu tratamiento.</p>
                <StepIndicator currentStep={currentStep} />
                <div className="mt-8">{renderStep()}</div>
            </div>
            <BookingResultModal isOpen={bookingResult.isOpen} onClose={handleCloseResultModal} status={bookingResult.status} message={bookingResult.message} />
        </div>
    );
};

export default BookingPage;
