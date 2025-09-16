import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { MOCK_SERVICES, MOCK_PROFESSIONALS, getAvailableTimeSlots } from '../data/mockData';
import { Service, Professional, TimeSlot } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';
import BookingResultModal from '../components/booking/BookingResultModal';

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
    const navigate = useNavigate();

    const isEditMode = useMemo(() => !!bookingState.appointmentToEdit, [bookingState.appointmentToEdit]);
    
    // --- State for Step 1: Service Selection ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    // --- State for Step 3: Date & Time Selection ---
    type SearchMode = 'date' | 'timeRange';
    const [searchMode, setSearchMode] = useState<SearchMode>('date');

    // State for 'date' search mode
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [weekOffset, setWeekOffset] = useState(0);

    // State for 'timeRange' search mode
    type TimeRangeKey = 'any' | 'morning' | 'afternoon' | 'custom';
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeKey>('any');
    const [customStartTime, setCustomStartTime] = useState('16:00');
    const [customEndTime, setCustomEndTime] = useState('18:00');

    interface FoundSlot {
        date: Date;
        slots: TimeSlot[];
    }
    const [foundSlotsByRange, setFoundSlotsByRange] = useState<FoundSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    
    // --- State for Result Modal ---
    const [bookingResult, setBookingResult] = useState<{
        isOpen: boolean;
        status: 'success' | 'error';
        message: string;
    }>({
        isOpen: false,
        status: 'success',
        message: '',
    });

    // --- Memoized values for filtering ---
    const categories = useMemo(() => 
        ['Todos', ...new Set(MOCK_SERVICES.map(s => s.category))]
    , []);

    const filteredServices = useMemo(() => {
        return MOCK_SERVICES.filter(service => {
        const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory]);


    // Effect to manage the current step based on the booking state.
    // It sets the initial step and handles navigation when a service is selected.
    useEffect(() => {
        if (isEditMode) {
            setCurrentStep(3);
        } else if (bookingState.service) {
            setCurrentStep(2);
        } else {
            setCurrentStep(1);
        }
    }, [isEditMode, bookingState.service]);

    // Effect to sync the local selectedDate with the global booking state's date.
    // This ensures the calendar displays the correct date, especially in edit mode or when navigating back.
    useEffect(() => {
        setSelectedDate(bookingState.date || new Date());
    }, [bookingState.date]);


    // Effect for 'date' search mode
    useEffect(() => {
        if (currentStep === 3 && searchMode === 'date') {
            const slots = getAvailableTimeSlots(selectedDate, bookingState.professional?.id);
            setAvailableSlots(slots);
        }
    }, [currentStep, searchMode, selectedDate, bookingState.professional]);
    
    // Helper to check if a time is within a range for 'timeRange' search mode
    const isInRange = useCallback((time: string, range: TimeRangeKey): boolean => {
        const [hour] = time.split(':').map(Number);
        switch (range) {
            case 'any':
                return true;
            case 'morning':
                return hour >= 9 && hour < 14;
            case 'afternoon':
                return hour >= 15 && hour < 20;
            case 'custom': {
                const [startHour] = customStartTime.split(':').map(Number);
                const [endHour] = customEndTime.split(':').map(Number);
                return hour >= startHour && hour <= endHour;
            }
            default:
                return false;
        }
    }, [customStartTime, customEndTime]);

    // Effect for 'timeRange' search mode: finds next available slots based on range
    useEffect(() => {
        if (currentStep === 3 && searchMode === 'timeRange') {
            setIsLoadingSlots(true);
            // Simulating a search delay for better UX
            const searchTimeout = setTimeout(() => {
                const results: FoundSlot[] = [];
                const today = new Date();
                
                for (let i = 0; i < 30; i++) { // Search next 30 days
                    const dateToCheck = new Date();
                    dateToCheck.setDate(today.getDate() + i);
                    dateToCheck.setHours(0, 0, 0, 0); // Normalize date

                    const slotsForDay = getAvailableTimeSlots(dateToCheck, bookingState.professional?.id);
                    const availableSlotsInRange = slotsForDay.filter(slot => slot.available && isInRange(slot.time, selectedTimeRange));

                    if (availableSlotsInRange.length > 0) {
                        results.push({
                            date: dateToCheck,
                            slots: availableSlotsInRange,
                        });
                    }

                    if (results.length >= 5) { // Stop after finding 5 available days
                        break;
                    }
                }
                setFoundSlotsByRange(results);
                setIsLoadingSlots(false);
            }, 300); // Small delay to show loading state
            
            return () => clearTimeout(searchTimeout);
        }
    }, [currentStep, searchMode, selectedTimeRange, bookingState.professional, isInRange]);


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
        // Simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success or failure
        const isSuccess = Math.random() > 0.2; // 80% success rate

        if (isSuccess) {
            setBookingResult({
                isOpen: true,
                status: 'success',
                message: isEditMode ? 'Tu cita ha sido modificada correctamente.' : 'Tu cita ha sido confirmada correctamente. ¡Te esperamos!'
            });
        } else {
             setBookingResult({
                isOpen: true,
                status: 'error',
                message: 'Error de conexión: No hemos podido procesar tu solicitud. Por favor, inténtalo de nuevo.'
            });
        }
    };
    
    const handleCloseResultModal = () => {
        const status = bookingResult.status;
        setBookingResult({ isOpen: false, status: 'success', message: '' });

        if (status === 'success') {
            resetBooking();
            navigate('/perfil');
        }
        // On error, just close the modal, allowing the user to try again from the confirmation step.
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


    // --- Step 1: Service Selection ---
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
                        <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors duration-200 border-2 ${
                            selectedCategory === category
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-secondary border-gray-300 hover:bg-gray-100'
                        }`}
                        >
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
    
    // --- Step 2: Professional Selection ---
    const ProfessionalStep = () => {
        const availableProfessionals = MOCK_PROFESSIONALS.filter(p => bookingState.service?.professionalIds.includes(p.id));

        return (
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
                            <img src={prof.avatarUrl} alt={prof.name} className="w-16 h-16 rounded-full object-cover mr-4" />
                            <div>
                                <h3 className="font-bold text-secondary text-lg">{prof.name}</h3>
                            </div>
                        </button>
                    ))}
                </div>
                 <button onClick={() => setCurrentStep(1)} className="mt-6 text-sm text-light-text hover:underline">Volver a servicios</button>
            </div>
        );
    };

    // --- Step 3: Date & Time Selection ---
    const DateTimeStep = () => (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary mb-6 text-center">3. Elige fecha y hora</h2>
            
            {/* Search Mode Tabs */}
            <div className="flex justify-center border-b mb-6">
                <button onClick={() => setSearchMode('date')} className={`px-6 py-2 font-semibold ${searchMode === 'date' ? 'border-b-2 border-primary text-primary' : 'text-light-text'}`}>Buscar por Día</button>
                <button onClick={() => setSearchMode('timeRange')} className={`px-6 py-2 font-semibold ${searchMode === 'timeRange' ? 'border-b-2 border-primary text-primary' : 'text-light-text'}`}>Buscar por Franja</button>
            </div>

            {searchMode === 'date' ? (
                <>
                    {/* Week Navigator */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled={weekOffset === 0}><ChevronLeftIcon className="w-6 h-6" /></button>
                        <span className="font-semibold text-secondary">
                            {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-6 h-6" /></button>
                    </div>
                    {/* Day Selector */}
                    <div className="grid grid-cols-7 gap-2 mb-6">
                        {weekDays.map(day => (
                            <button 
                                key={day.toISOString()} 
                                onClick={() => setSelectedDate(day)}
                                className={`p-2 rounded-lg text-center transition ${selectedDate.toDateString() === day.toDateString() ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                            >
                                <span className="text-xs uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                <span className="block font-bold text-lg">{day.getDate()}</span>
                            </button>
                        ))}
                    </div>

                    {/* Available Slots */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {availableSlots.map(slot => (
                            <button 
                                key={slot.time}
                                onClick={() => handleSelectDateTime(selectedDate, slot.time)}
                                disabled={!slot.available}
                                className="px-4 py-3 rounded-lg font-semibold transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed bg-secondary text-white hover:bg-primary"
                            >
                                {slot.time}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* Time Range Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {(['any', 'morning', 'afternoon', 'custom'] as TimeRangeKey[]).map(range => (
                            <button key={range} onClick={() => setSelectedTimeRange(range)} className={`px-4 py-3 rounded-lg font-semibold transition ${selectedTimeRange === range ? 'bg-primary text-white' : 'bg-gray-200 text-secondary'}`}>
                                {{'any': 'Cualquier hora', 'morning': 'Mañana', 'afternoon': 'Tarde', 'custom': 'Personalizado'}[range]}
                            </button>
                        ))}
                    </div>
                    {selectedTimeRange === 'custom' && (
                        <div className="flex items-center justify-center gap-4 p-4 bg-gray-100 rounded-lg mb-4">
                            <label>Desde: <input type="time" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)} className="p-1 rounded border"/></label>
                            <label>Hasta: <input type="time" value={customEndTime} onChange={e => setCustomEndTime(e.target.value)} className="p-1 rounded border"/></label>
                        </div>
                    )}

                    {/* Found Slots */}
                    {isLoadingSlots && <div className="text-center p-8">Buscando huecos disponibles...</div>}
                    {!isLoadingSlots && (
                         <div className="space-y-4 max-h-80 overflow-y-auto">
                             {foundSlotsByRange.length > 0 ? foundSlotsByRange.map(({ date, slots }) => (
                                 <div key={date.toISOString()}>
                                     <h4 className="font-bold text-secondary mb-2">{date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                                     <div className="flex flex-wrap gap-3">
                                         {slots.map(slot => (
                                             <button key={slot.time} onClick={() => handleSelectDateTime(date, slot.time)} className="px-4 py-2 rounded-lg font-semibold transition bg-secondary text-white hover:bg-primary">
                                                 {slot.time}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )) : <p className="text-center text-light-text p-8">No se encontraron huecos en los próximos 30 días con esos criterios.</p>}
                         </div>
                    )}
                </>
            )}

            <div className="mt-8 flex justify-center">
                 <button onClick={() => setCurrentStep(2)} className="text-sm text-light-text hover:underline">Volver a profesionales</button>
            </div>
        </div>
    );
    
    // --- Step 4: Confirmation ---
    const ConfirmationStep = () => {
        const { service, professional, date, time } = bookingState;
        if (!service || !date || !time) return <p>Faltan datos de la reserva.</p>;

        const professionalName = professional?.name || 'Cualquier profesional';
        const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-secondary mb-6 text-center">
                   {isEditMode ? '4. Confirma tu modificación' : '4. Confirma tu reserva'}
                </h2>
                <div className="space-y-4 p-4 bg-light-bg rounded-lg border border-gray-200">
                    <div>
                        <h3 className="font-semibold text-sm text-light-text">Servicio</h3>
                        <p className="text-lg text-secondary">{service.name}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-sm text-light-text">Profesional</h3>
                        <p className="text-lg text-secondary">{professionalName}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-light-text">Fecha y Hora</h3>
                        <p className="text-lg text-secondary">{formattedDate} a las {time}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-sm text-light-text">Total</h3>
                        <p className="text-xl font-bold text-primary">{service.price}€</p>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setCurrentStep(3)}
                        className="w-full sm:w-1/2 order-2 sm:order-1 bg-white text-secondary py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        {isEditMode ? 'Cambiar Fecha/Hora' : 'Cambiar Hora'}
                    </button>
                    <button
                        onClick={handleFinalConfirmBooking}
                        className="w-full sm:w-1/2 order-1 sm:order-2 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
                    >
                        {isEditMode ? 'Confirmar Modificación' : 'Confirmar Reserva'}
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
                <h1 className="text-4xl font-extrabold text-secondary tracking-tight text-center mb-4">
                     {isEditMode ? 'Modificar Cita' : 'Reservar una Cita'}
                </h1>
                 <p className="text-center text-lg text-light-text mb-8">
                    {isEditMode 
                        ? 'Selecciona una nueva fecha u hora para tu cita.' 
                        : 'Sigue los pasos para reservar tu tratamiento.'
                    }
                </p>
                {!isEditMode && <StepIndicator currentStep={currentStep} />}
                <div className="mt-8">{renderStep()}</div>
            </div>
            <BookingResultModal 
                isOpen={bookingResult.isOpen}
                onClose={handleCloseResultModal}
                status={bookingResult.status}
                message={bookingResult.message}
            />
        </div>
    );
};

export default BookingPage;