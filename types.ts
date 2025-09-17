
export interface Service {
  id: number;
  name: string;
  category: string;
  description: string; // Assuming this field exists or will be added to DB, as UI depends on it
  duration: number; // in minutes
  break_time: number; // in minutes
  price: number;
}

export interface Professional {
  id: string; // UUID
  full_name: string;
  avatar_url: string;
}

export interface Appointment {
  id: string; // UUID
  client_id: string; // UUID
  service_id: number;
  professional_id: string; // UUID
  start_time: string; // TIMESTAMPTZ
  end_time: string; // TIMESTAMPTZ
  status: 'confirmada' | 'completada' | 'cancelada';
  notes?: string;
  // Joined data for UI
  services?: Service;
  professionals?: Professional;
}

// Corresponds to client_bonos table
export interface ClientVoucher {
  id: string; // UUID
  client_id: string; // UUID
  bono_id: number;
  remaining_sessions: number;
  purchase_date: string; // TIMESTAMPTZ
  // Joined data for UI
  bono_definitions?: BonoDefinition;
}

// Corresponds to bono_definitions table
export interface BonoDefinition {
    id: number;
    service_id: number;
    name: string;
    total_sessions: number;
    price: number;
    is_active: boolean;
    // Joined data for UI
    services?: Service;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  image_url: string;
  original_price: number;
  promo_price: number;
}

export interface Client {
  id: string; // UUID, references auth.users.id
  full_name: string;
  phone: string;
  email: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
