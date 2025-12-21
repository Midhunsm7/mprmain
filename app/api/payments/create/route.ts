// app/api/payments/create/route.js
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { 
      guest_id,
      amount,
      total_amount,
      payment_mode,
      upi_reference,
      bank_txn_id,
      status = 'completed'
    } = body;

    // Get guest details
    const { data: guest } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guest_id)
      .single();

    if (!guest) {
      return new Response(JSON.stringify({ error: 'Guest not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          amount,
          total_amount,
          payment_mode,
          upi_reference: upi_reference || null,
          bank_txn_id: bank_txn_id || null,
          status,
          guest_id,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error creating payment:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in payments create:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}