
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Service, Professional } from '../types';

interface BookingState {
    service: Service | null;
    professional: Professional | null;
    date: Date | null;
    time: string | null;
}

interface BookingContextType {
  bookingState: BookingState;
  setService: (service: Service) => void;
  setProfessional: (professional: Professional | null) => void;
  setDateTime: (date: Date, time: string) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialState: BookingState = {
    service: null,
    professional: null,
    date: null,
    time: null,
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookingState, setBookingState] = useState<BookingState>(initialState);

  const setService = useCallback((service: Service) => {
    setBookingState(prev => ({ ...initialState, service }));
  }, []);
  
  const setProfessional = useCallback((professional: Professional | null) => {
    setBookingState(prev => ({ ...prev, professional, date: null, time: null }));
  }, []);

  const setDateTime = useCallback((date: Date, time: string) => {
    setBookingState(prev => ({ ...prev, date, time }));
  }, []);

  const resetBooking = useCallback(() => {
    setBookingState(initialState);
  }, []);

  return (
    <BookingContext.Provider value={{ bookingState, setService, setProfessional, setDateTime, resetBooking }}>
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
