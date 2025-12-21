import { NextRequest, NextResponse } from 'next/server';
import { cancelEventBooking } from '@/lib/db/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const booking = await cancelEventBooking(body.id);
    return NextResponse.json({ 
      success: true, 
      booking 
    });
  } catch (error: any) {
    console.error('POST /api/events/cancel error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}