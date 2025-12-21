import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const department = searchParams.get('department');
    
    let query = supabaseServer
      .from('staff_meals_log')
      .select(`
        *,
        staff:staff_id (name, department),
        approved_by_staff:approved_by (name)
      `)
      .gte('consumed_at', `${date}T00:00:00`)
      .lte('consumed_at', `${date}T23:59:59`)
      .order('consumed_at', { ascending: false });

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by staff for summary
    const summary = data.reduce((acc: any, log: any) => {
      const staffName = log.staff?.name || 'Unknown';
      if (!acc[staffName]) {
        acc[staffName] = {
          staff_id: log.staff_id,
          name: staffName,
          department: log.department,
          total_items: 0,
          total_amount: 0,
          meals: []
        };
      }
      acc[staffName].total_items += log.quantity;
      acc[staffName].total_amount += (log.price * log.quantity);
      acc[staffName].meals.push({
        item_name: log.item_name,
        quantity: log.quantity,
        price: log.price,
        meal_type: log.meal_type,
        consumed_at: log.consumed_at
      });
      return acc;
    }, {});

    return NextResponse.json({
      date,
      logs: data,
      summary: Object.values(summary),
      total_meals: data.length,
      total_amount: Object.values(summary).reduce((sum: number, s: any) => sum + s.total_amount, 0)
    });
  } catch (error: any) {
    console.error('Staff Meals Report Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}