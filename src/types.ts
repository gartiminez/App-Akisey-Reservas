
export interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: number; // in minutes
  price: number;
  professionalIds: number[];
}

export interface Professional {
  id: number;
  name: string;
  avatarUrl: string;
  specialties: number[]; // Array of service IDs
}

export interface Appointment {
  id: string;
  serviceId: number;
  professionalId: number;
  start: Date;
  end: Date;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Voucher {
  id: string;
  serviceId: number;
  totalSessions: number;
  remainingSessions: number;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  promoPrice: number;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
