
import { Service, Professional, Appointment, Voucher, Promotion, Client, TimeSlot } from '../types';

export const MOCK_SERVICES: Service[] = [
  { id: 1, name: 'Masaje de espalda', category: 'Masajes', description: 'Un masaje relajante para aliviar la tensión de la espalda y los hombros.', duration: 60, price: 45, professionalIds: [1, 3] },
  { id: 2, name: 'Manicura semipermanente', category: 'Uñas', description: 'Manicura completa con esmalte de larga duración.', duration: 45, price: 25, professionalIds: [2, 3] },
  { id: 3, name: 'Limpieza facial profunda', category: 'Facial', description: 'Tratamiento para purificar la piel y eliminar impurezas.', duration: 75, price: 60, professionalIds: [1] },
  { id: 4, name: 'Pedicura completa', category: 'Uñas', description: 'Cuidado completo de pies y uñas, con esmaltado tradicional.', duration: 60, price: 35, professionalIds: [2] },
  { id: 5, name: 'Tratamiento corporal reafirmante', category: 'Corporal', description: 'Tratamiento para mejorar la firmeza y elasticidad de la piel.', duration: 90, price: 80, professionalIds: [1, 3] },
];

export const MOCK_PROFESSIONALS: Professional[] = [
  { id: 1, name: 'Ana', avatarUrl: 'https://picsum.photos/id/1027/200/200', specialties: [1, 3, 5] },
  { id: 2, name: 'Laura', avatarUrl: 'https://picsum.photos/id/1011/200/200', specialties: [2, 4] },
  { id: 3, name: 'Carmen', avatarUrl: 'https://picsum.photos/id/1005/200/200', specialties: [1, 2, 5] },
];

export const MOCK_PROMOTIONS: Promotion[] = [
    { id: 1, title: 'Pack Bienestar Total', description: 'Combina un masaje de espalda y una limpieza facial profunda a un precio especial.', imageUrl: 'https://picsum.photos/seed/promo1/800/600', originalPrice: 105, promoPrice: 90 },
    { id: 2, title: 'Especial Manos y Pies', description: 'Luce perfecta con nuestra manicura y pedicura semipermanente.', imageUrl: 'https://picsum.photos/seed/promo2/800/600', originalPrice: 60, promoPrice: 50 },
];

export const MOCK_CLIENT: Client = {
    id: 'user-123',
    fullName: 'Elena Rodríguez',
    phone: '+34600000000',
    email: 'elena.r@example.com'
};

export const MOCK_APPOINTMENTS: Appointment[] = [
    { id: 'appt-1', serviceId: 2, professionalId: 3, start: new Date(new Date().setDate(new Date().getDate() + 7)), end: new Date(new Date().setDate(new Date().getDate() + 7)), status: 'upcoming' },
    { id: 'appt-2', serviceId: 3, professionalId: 1, start: new Date(new Date().setDate(new Date().getDate() - 14)), end: new Date(new Date().setDate(new Date().getDate() - 14)), status: 'completed' },
    { id: 'appt-3', serviceId: 1, professionalId: 1, start: new Date(new Date().setDate(new Date().getDate() - 30)), end: new Date(new Date().setDate(new Date().getDate() - 30)), status: 'completed' },
];

export const MOCK_VOUCHERS: Voucher[] = [
    { id: 'voucher-1', serviceId: 1, totalSessions: 10, remainingSessions: 8 },
    { id: 'voucher-2', serviceId: 5, totalSessions: 5, remainingSessions: 2 },
];


export const getAvailableTimeSlots = (date: Date, professionalId?: number): TimeSlot[] => {
    // Mock logic: generate random availability
    const seed = date.getDate() + (professionalId || 0);
    const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00"];
    
    return times.map((time, index) => ({
      time,
      available: (seed + index) % (Math.random() < 0.3 ? 3 : 2) === 0, // Pseudo-random availability
    }));
};
