import { NextRequest, NextResponse } from 'next/server';
import { checkoutEventBooking } from '@/lib/db/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requiredFields = ['id', 'bill_amount', 'extra_charge', 'payment_method', 'end_time'];
    const missingFields = requiredFields.filter(field => body[field] === undefined || body[field] === null);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update event booking record
    const booking = await checkoutEventBooking(body.id, {
      end_time: body.end_time,
      bill_amount: body.bill_amount,
      extra_charge: body.extra_charge,
      payment_method: body.payment_method
    });

    // ---- NEW: Forward entry to accounts ----
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/accounts/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_amount: body.bill_amount,
          extra_charge: body.extra_charge,
          total_amount: Number(body.bill_amount) + Number(body.extra_charge),
          payment_method: body.payment_method,
          category: "event", // IMPORTANT
        })
      });
    } catch (accountError) {
      console.error("⚠ Failed to sync event revenue to Accounts:", accountError);
      // Not failing request — booking update succeeded, only finance sync failed
    }

    return NextResponse.json({ 
      success: true, 
      booking 
    });
  } catch (error: any) {
    console.error('POST /api/events/checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to checkout booking' },
      { status: 500 }
    );
  }
}
