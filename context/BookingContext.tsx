import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Service, Professional, Appointment } from '../types';
import { MOCK_SERVICES, MOCK_PROFESSIONALS } from '../data/mockData';

interface BookingState {
    service: Service | null;
    professional: Professional | null;
    date: Date | null;
    time: string | null;
    appointmentToEdit: Appointment | null;
}

interface BookingContextType {
  bookingState: BookingState;
  setService: (service: Service) => void;
  setProfessional: (professional: Professional | null) => void;
  setDateTime: (date: Date, time: string) => void;
  setAppointmentToEdit: (appointment: Appointment | null) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialState: BookingState = {
    service: null,
    professional: null,
    date: null,
    time: null,
    appointmentToEdit: null,
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookingState, setBookingState] = useState<BookingState>(initialState);

  const setService = useCallback((service: Service) => {
    setBookingState(prev => ({ ...initialState, service, appointmentToEdit: prev.appointmentToEdit }));
  }, []);
  
  const setProfessional = useCallback((professional: Professional | null) => {
    setBookingState(prev => ({ ...prev, professional, date: null, time: null }));
  }, []);

  const setDateTime = useCallback((date: Date, time: string) => {
    setBookingState(prev => ({ ...prev, date, time }));
  }, []);

  const setAppointmentToEdit = useCallback((appointment: Appointment | null) => {
    if (appointment) {
        const service = MOCK_SERVICES.find(s => s.id === appointment.serviceId);
        const professional = MOCK_PROFESSIONALS.find(p => p.id === appointment.professionalId);
        if (service) {
            setBookingState({
                service,
                professional: professional || null,
                date: appointment.start,
                time: appointment.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                appointmentToEdit: appointment,
            });
        }
    } else {
        setBookingState(prev => ({ ...prev, appointmentToEdit: null }));
    }
}, []);

  const resetBooking = useCallback(() => {
    setBookingState(initialState);
  }, []);

  return (
    <BookingContext.Provider value={{ bookingState, setService, setProfessional, setDateTime, setAppointmentToEdit, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
