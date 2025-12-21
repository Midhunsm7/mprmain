import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Fetch all data in parallel
    const [
      roomsRes,
      guestsRes,
      paymentsRes,
      todayPaymentsRes,
      inventoryRes,
      dishesRes,
      pendingBillsRes,
      todayBookingsRes,
      nightAuditRes,
      notificationsRes
    ] = await Promise.all([
      supabaseAdmin.from('rooms').select('id, status, room_number, type_id'),
      supabaseAdmin.from('guests').select('id, status, name, room_number, check_out, total_charge'),
      supabaseAdmin.from('payments').select('id, amount, total_amount, status, created_at, guest_id'),
      supabaseAdmin.from('payments')
        .select('total_amount, amount')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),
      supabaseAdmin.from('inventory_items').select('id, name, stock, threshold'),
      supabaseAdmin.from('dishes').select('id, name, active').eq('active', true),
      supabaseAdmin.from('kot_bills').select('id').eq('payment_status', 'unpaid'),
      supabaseAdmin.from('bookings')
        .select('id')
        .eq('check_in', today.toISOString().split('T')[0]),
      supabaseAdmin.from('night_audits')
        .select('total_room_revenue, total_payments')
        .order('audit_date', { ascending: false })
        .limit(1),
      supabaseAdmin.from('notifications')
        .select('id, title, message, created_at, status')
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Fetch recent activities from audit_logs
    const { data: recentActivities } = await supabaseAdmin
      .from('audit_logs')
      .select('id, action, details, created_at, actor_email')
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent checkouts
    const { data: recentCheckouts } = await supabaseAdmin
      .from('guests')
      .select(`
        id,
        name,
        room_number,
        check_out,
        total_charge,
        payments!left(total_amount)
      `)
      .eq('status', 'checked-out')
      .order('check_out', { ascending: false })
      .limit(5);

    // Calculate metrics
    const rooms = roomsRes.data || [];
    const guests = guestsRes.data || [];
    const payments = paymentsRes.data || [];
    const todayPayments = todayPaymentsRes.data || [];

    const totalRooms = rooms.length;
    const occupied = rooms.filter((r: any) => r.status === 'occupied').length;
    const housekeeping = rooms.filter((r: any) => r.status === 'housekeeping').length;
    const maintenance = rooms.filter((r: any) => r.status === 'maintenance').length;
    const checkedInGuests = guests.filter((g: any) => g.status === 'checked-in').length;

    // Calculate revenue
    const totalRevenue = payments.reduce(
      (sum: number, p: any) => sum + Number(p.total_amount || p.amount || 0),
      0
    );

    const todaysTotal = todayPayments.reduce(
      (sum: number, p: any) => sum + Number(p.total_amount || p.amount || 0),
      0
    );

    // Calculate stats
    const avgRevenuePerRoom = totalRooms > 0 ? Math.round(totalRevenue / totalRooms) : 0;
    const availableTonight = totalRooms - occupied - housekeeping;
    
    // Get occupancy rate from night audit or calculate
    const occupancyRate = totalRooms > 0 
      ? Math.round((occupied / totalRooms) * 100) 
      : 0;

    // Quick stats
    const inventoryItems = inventoryRes.data?.length || 0;
    const activeDishes = dishesRes.data?.length || 0;
    const pendingBills = pendingBillsRes.data?.length || 0;
    const todayBookings = todayBookingsRes.data?.length || 0;

    // Performance metrics (you might want to calculate these based on historical data)
    const avgDailyRate = totalRooms > 0 ? Math.round(totalRevenue / totalRooms / 30) : 0; // Simplified calculation
    const revPAR = occupancyRate > 0 ? Math.round((totalRevenue / totalRooms) * (occupancyRate / 100) / 30) : 0;

    const data = {
      counts: {
        totalRooms,
        occupied,
        housekeeping,
        maintenance,
        checkedInGuests,
      },
      revenue: {
        total: totalRevenue,
        today: todaysTotal,
        monthly: nightAuditRes.data?.[0]?.total_room_revenue || 0,
      },
      stats: {
        occupancyRate,
        avgStayDuration: 2.5, // This should be calculated from booking data
        avgRevenuePerRoom,
        availableTonight,
        avgDailyRate: `₹${avgDailyRate.toLocaleString('en-IN')}`,
        revPAR: `₹${revPAR.toLocaleString('en-IN')}`,
      },
      quickStats: {
        inventoryItems,
        activeDishes,
        pendingBills,
        todayBookings,
      },
      recentActivities: recentActivities || [],
      recentCheckouts: recentCheckouts || [],
      notifications: notificationsRes.data || [],
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}