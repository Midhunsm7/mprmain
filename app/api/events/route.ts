import { NextRequest, NextResponse } from 'next/server';
import { getEventBookings, createEventBooking } from '@/lib/db/events';

export async function GET() {
  try {
    const bookings = await getEventBookings();
    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('GET /api/events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requiredFields = ['guest_name', 'event_type', 'start_time'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const booking = await createEventBooking(body);
    return NextResponse.json({ 
      success: true, 
      booking 
    });
  } catch (error: any) {
    console.error('POST /api/events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}