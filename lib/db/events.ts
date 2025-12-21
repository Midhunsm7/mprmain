import { createClient } from '@/utils/supabase/server';
import { EventBooking, CreateEventBooking, CheckoutEventBooking } from '@/types/events';

export async function getEventBookings() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event bookings:', error);
    throw error;
  }

  return data || [];
}

export async function createEventBooking(booking: CreateEventBooking) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_bookings')
    .insert([{
      guest_name: booking.guest_name,
      event_type: booking.event_type,
      start_time: booking.start_time,
      end_time: booking.end_time,
      estimated_attendees: booking.estimated_attendees,
      contact_email: booking.contact_email,
      contact_phone: booking.contact_phone,
      special_requests: booking.special_requests,
      status: booking.status || 'pending',
      extra_charge: 0,
      bill_amount: null,
      payment_method: null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating event booking:', error);
    throw error;
  }

  return data;
}

export async function checkinEventBooking(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_bookings')
    .update({
      status: 'ongoing',
      start_time: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error checking in event booking:', error);
    throw error;
  }

  return data;
}

export async function checkoutEventBooking(id: string, checkoutData: CheckoutEventBooking) {
  const supabase = await createClient();

  // 1️⃣ Update event booking record
  const { data: updatedBooking, error: updateErr } = await supabase
    .from('event_bookings')
    .update({
      status: 'completed',
      end_time: checkoutData.end_time,
      bill_amount: checkoutData.bill_amount,
      extra_charge: checkoutData.extra_charge,
      payment_method: checkoutData.payment_method
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    console.error('Error checking out event booking:', updateErr);
    throw updateErr;
  }

  // 2️⃣ Insert into accounts table to reflect revenue
  const total_amount = Number(checkoutData.bill_amount || 0) + Number(checkoutData.extra_charge || 0);

  const { error: accountErr } = await supabase
    .from('accounts')
    .insert({
      category: 'event',
      total_amount,
      payment_method: checkoutData.payment_method || 'cash',
      created_at: new Date().toISOString(),
      description: `${updatedBooking.event_type} - ${updatedBooking.guest_name}`
    });

  if (accountErr) {
    console.error('FAILED TO INSERT EVENT INTO ACCOUNTS:', accountErr);
    throw accountErr;
  }

  return updatedBooking;
}


export async function cancelEventBooking(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_bookings')
    .update({
      status: 'cancelled'
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling event booking:', error);
    throw error;
  }

  return data;
}

export async function updateEventBooking(id: string, updates: Partial<EventBooking>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event booking:', error);
    throw error;
  }

  return data;
}