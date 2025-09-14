
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { MOCK_SERVICES, MOCK_PROFESSIONALS, getAvailableTimeSlots } from '../data/mockData';
import { Service, Professional, TimeSlot } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

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


    useEffect(() => {
        if (bookingState.service) {
            setCurrentStep(2);
        }
    }, [bookingState.service]);

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

    const handleConfirmBooking = () => {
        alert('¡Cita confirmada! (Simulación)');
        resetBooking();
        navigate('/perfil');
    };
    
    const weekDays = useMemo(() => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (weekOffset * 7));
        return Array.from({length: 7}).map((_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [weekOffset]);

    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 9; h <= 19; h++) {
            options.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return options;
    }, []);

    const timeRanges: { key: TimeRangeKey, label: string }[] = [
        { key: 'any', label: 'Cualquier hora' },
        { key: 'morning', label: 'Mañana' },
        { key: 'afternoon', label: 'Tarde' },
        { key: 'custom', label: 'Elegir...' },
    ];

    // Auto-adjust end time if start time becomes >= end time
    useEffect(() => {
        if (customStartTime >= customEndTime) {
            const startIndex = timeOptions.findIndex(t => t === customStartTime);
            if (startIndex < timeOptions.length - 1) {
                setCustomEndTime(timeOptions[startIndex + 1]);
            }
        }
    }, [customStartTime, customEndTime, timeOptions]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-4xl font-extrabold text-secondary tracking-tight text-center mb-8">Reservar una Cita</h1>
            <StepIndicator currentStep={currentStep} />
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-10 min-h-[400px]">

                {/* Step 1: Select Service */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-secondary mb-6">1. Selecciona un Servicio</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {MOCK_SERVICES.map(service => (
                                <button key={service.id} onClick={() => handleSelectService(service)} className="text-left p-4 border rounded-lg hover:bg-primary hover:text-white transition-colors hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary">
                                    <h3 className="font-semibold">{service.name}</h3>
                                    <p className="text-sm">{service.price}€ - {service.duration} min</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Professional */}
                {currentStep === 2 && bookingState.service && (
                    <div>
                         <h2 className="text-2xl font-bold text-secondary mb-6">2. Elige un Profesional</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <button onClick={() => handleSelectProfessional(null)} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-primary hover:text-white transition-colors hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary">
                                 <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-3xl text-gray-500">?</span>
                                 </div>
                                 <h3 className="font-semibold text-lg">Indiferente</h3>
                             </button>
                             {MOCK_PROFESSIONALS.filter(p => bookingState.service?.professionalIds.includes(p.id)).map(prof => (
                                <button key={prof.id} onClick={() => handleSelectProfessional(prof)} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-primary hover:text-white transition-colors hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary">
                                    <img src={prof.avatarUrl} alt={prof.name} className="w-16 h-16 rounded-full object-cover" />
                                    <h3 className="font-semibold text-lg">{prof.name}</h3>
                                </button>
                             ))}
                         </div>
                         <button onClick={() => setCurrentStep(1)} className="mt-8 text-sm text-gray-600 hover:text-secondary">← Volver a Servicios</button>
                    </div>
                )}
                
                {/* Step 3: Select Date & Time */}
                {currentStep === 3 && (
                    <div>
                        <h2 className="text-2xl font-bold text-secondary mb-4">3. Elige Fecha y Hora</h2>
                        
                        {/* Search Mode Tabs */}
                        <div className="flex border-b mb-6">
                            <button onClick={() => setSearchMode('date')} className={`px-4 py-2 text-base md:text-lg font-semibold transition-colors duration-200 ${searchMode === 'date' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-secondary'}`}>
                                Por Fecha
                            </button>
                            <button onClick={() => setSearchMode('timeRange')} className={`px-4 py-2 text-base md:text-lg font-semibold transition-colors duration-200 ${searchMode === 'timeRange' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-secondary'}`}>
                                Por Franja Horaria
                            </button>
                        </div>

                        {/* Content for 'date' search mode */}
                        {searchMode === 'date' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled={weekOffset <= 0}><ChevronLeftIcon className="w-6 h-6"/></button>
                                    <span className="font-semibold">{weekDays[0].toLocaleDateString('es-ES', {month: 'long'})} {weekDays[0].getFullYear()}</span>
                                    <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-6 h-6"/></button>
                                </div>
                                <div className="grid grid-cols-7 gap-2 text-center mb-4">
                                     {weekDays.map(day => (
                                        <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`p-2 rounded-lg transition-colors ${selectedDate.toDateString() === day.toDateString() ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
                                            <p className="text-xs">{day.toLocaleDateString('es-ES', {weekday: 'short'})}</p>
                                            <p className="font-bold text-lg">{day.getDate()}</p>
                                        </button>
                                     ))}
                                </div>
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-semibold text-center mb-4">Horas disponibles para el {selectedDate.toLocaleDateString('es-ES', {dateStyle: 'long'})}</h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {availableSlots.map(slot => (
                                            <button key={slot.time} onClick={() => handleSelectDateTime(selectedDate, slot.time)} disabled={!slot.available} className="px-4 py-2 border rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed enabled:hover:bg-primary enabled:hover:text-white enabled:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content for 'timeRange' search mode */}
                        {searchMode === 'timeRange' && (
                             <div>
                                <h3 className="font-semibold text-light-text text-center mb-4">¿Cuándo te viene bien?</h3>
                                <div className="flex justify-center gap-2 md:gap-4 mb-4">
                                    {timeRanges.map(range => (
                                        <button key={range.key} onClick={() => setSelectedTimeRange(range.key)} className={`px-4 py-2 text-sm md:text-base border rounded-full font-semibold transition-colors ${selectedTimeRange === range.key ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-gray-300 hover:bg-gray-100'}`}>
                                            {range.label}
                                        </button>
                                    ))}
                                </div>

                                {selectedTimeRange === 'custom' && (
                                    <div className="mb-8 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                                        <label htmlFor="start-time" className="text-light-text">Entre las</label>
                                        <select
                                            id="start-time"
                                            value={customStartTime}
                                            onChange={(e) => setCustomStartTime(e.target.value)}
                                            className="px-2 py-1 border border-gray-300 rounded-md bg-white focus:ring-primary focus:border-primary"
                                            aria-label="Hora de inicio"
                                        >
                                            {timeOptions.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <label htmlFor="end-time" className="text-light-text">y las</label>
                                        <select
                                            id="end-time"
                                            value={customEndTime}
                                            onChange={(e) => setCustomEndTime(e.target.value)}
                                            className="px-2 py-1 border border-gray-300 rounded-md bg-white focus:ring-primary focus:border-primary"
                                            aria-label="Hora de fin"
                                        >
                                            {timeOptions.filter(t => t > customStartTime).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                )}
                                 <div className="border-t pt-4 mt-4 space-y-4">
                                     {isLoadingSlots ? (
                                         <p className="text-center text-light-text">Buscando los próximos huecos disponibles...</p>
                                     ) : foundSlotsByRange.length > 0 ? (
                                         foundSlotsByRange.map(result => (
                                             <div key={result.date.toISOString()}>
                                                 <h4 className="font-bold text-secondary mb-2">{result.date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                                                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                      {result.slots.map(slot => (
                                                        <button key={slot.time} onClick={() => handleSelectDateTime(result.date, slot.time)} className="px-4 py-2 border rounded-lg transition-colors hover:bg-primary hover:text-white border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                                                             {slot.time}
                                                        </button>
                                                     ))}
                                                 </div>
                                             </div>
                                         ))
                                     ) : (
                                         <p className="text-center text-light-text pt-4">No se encontraron huecos disponibles en esta franja horaria. Prueba con otra.</p>
                                     )}
                                 </div>
                             </div>
                        )}
                        <button onClick={() => setCurrentStep(2)} className="mt-8 text-sm text-gray-600 hover:text-secondary">← Volver a Profesionales</button>
                    </div>
                )}


                {/* Step 4: Confirmation */}
                {currentStep === 4 && bookingState.service && bookingState.date && bookingState.time && (
                    <div>
                        <h2 className="text-2xl font-bold text-secondary mb-6">4. Confirma tu Cita</h2>
                        <div className="space-y-4 p-6 bg-light-bg rounded-lg border">
                            <div>
                                <h3 className="font-semibold text-light-text">Servicio</h3>
                                <p className="text-lg text-secondary">{bookingState.service.name}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-light-text">Profesional</h3>
                                <p className="text-lg text-secondary">{bookingState.professional?.name || 'Indiferente'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-light-text">Fecha y Hora</h3>
                                <p className="text-lg text-secondary">{bookingState.date.toLocaleDateString('es-ES', {dateStyle: 'full'})} a las {bookingState.time}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-light-text">Total</h3>
                                <p className="text-xl font-bold text-primary">{bookingState.service.price}€</p>
                            </div>
                        </div>
                        <div className="mt-8 flex flex-col md:flex-row gap-4">
                            <button onClick={() => setCurrentStep(3)} className="w-full md:w-auto px-6 py-3 border border-gray-300 rounded-lg text-secondary font-semibold hover:bg-gray-100">
                                Cambiar Hora
                            </button>
                            <button onClick={handleConfirmBooking} className="w-full md:w-auto flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors">
                                Confirmar Reserva
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;
