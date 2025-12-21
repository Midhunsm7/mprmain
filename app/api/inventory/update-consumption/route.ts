import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const { item_id, quantity, consumption_type = 'nc' } = await request.json();

    // Get current stock
    const { data: item, error: itemError } = await supabaseServer
      .from('inventory_items')
      .select('stock')
      .eq('id', item_id)
      .single();

    if (itemError) throw itemError;

    // Update stock
    const newStock = Math.max(0, item.stock - quantity);
    const { error: updateError } = await supabaseServer
      .from('inventory_items')
      .update({ stock: newStock })
      .eq('id', item_id);

    if (updateError) throw updateError;

    // Log stock movement
    const { error: logError } = await supabaseServer
      .from('stock_logs')
      .insert({
        item_id,
        action: 'out',
        quantity,
        note: `NC consumption: ${consumption_type}`,
        department: 'restaurant'
      });

    if (logError) throw logError;

    return NextResponse.json({ success: true, new_stock: newStock });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}