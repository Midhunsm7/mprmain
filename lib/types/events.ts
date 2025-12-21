export interface EventBooking {
  id: string;
  guest_name: string;
  event_type: string;
  start_time: string;
  end_time: string | null;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  bill_amount: number | null;
  extra_charge: number;
  payment_method: string | null;
  estimated_attendees?: number | null;
  special_requests?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at?: string;
}

export interface CreateEventBooking {
  guest_name: string;
  event_type: string;
  start_time: string;
  end_time?: string | null;
  estimated_attendees?: number;
  contact_email?: string;
  contact_phone?: string;
  special_requests?: string;
  status?: 'pending' | 'ongoing' | 'completed' | 'cancelled';
}

export interface CheckoutEventBooking {
  end_time: string;
  bill_amount: number;
  extra_charge: number;
  payment_method: string;
}