import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, staff_id, department, meal_type, notes, approved_by } = body;

    // Get the order with items
    const { data: order, error: orderError } = await supabaseServer
      .from('kot_orders')
      .select(`
        *,
        kot_items(*)
      `)
      .eq('id', order_id)
      .single();

    if (orderError) throw orderError;

    // Update order billing type
    const { error: updateError } = await supabaseServer
      .from('kot_orders')
      .update({
        billing_type: 'nc',
        status: 'completed'
      })
      .eq('id', order_id);

    if (updateError) throw updateError;

    // Update items billing type
    const { error: itemsError } = await supabaseServer
      .from('kot_items')
      .update({ billing_type: 'nc' })
      .eq('order_id', order_id);

    if (itemsError) throw itemsError;

    // Log staff meal consumption - FIXED: Use kot_item_id instead of item_id
    const staffMealsLogs = order.kot_items.map((item: any) => ({
      staff_id,
      order_id,
      kot_item_id: item.id, // Use kot_item_id instead of item_id
      item_name: item.item_name,
      quantity: item.quantity,
      price: item.price,
      department,
      meal_type,
      approved_by,
      notes
    }));

    const { error: logError } = await supabaseServer
      .from('staff_meals_log')
      .insert(staffMealsLogs);

    if (logError) throw logError;

    // Update inventory consumption if items are linked to inventory
    for (const item of order.kot_items) {
      await updateInventoryConsumption(item.item_name, item.quantity);
    }

    return NextResponse.json({ success: true, message: 'Order marked as NC' });
  } catch (error: any) {
    console.error('NC Order Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function updateInventoryConsumption(itemName: string, quantity: number) {
  const today = new Date().toISOString().split('T')[0];
  
  // Try to find inventory item by name
  const { data: inventoryItem } = await supabaseServer
    .from('inventory_items')
    .select('id, stock, name')
    .ilike('name', `%${itemName}%`)
    .limit(1)
    .single();

  if (!inventoryItem) {
    console.log(`Inventory item not found for: ${itemName}`);
    return;
  }

  // Update daily stock consumption
  const { data: existing } = await supabaseServer
    .from('daily_stock_consumption')
    .select('id, nc_consumption')
    .eq('date', today)
    .eq('item_id', inventoryItem.id)
    .maybeSingle();

  if (existing) {
    // Update existing record
    await supabaseServer
      .from('daily_stock_consumption')
      .update({
        nc_consumption: existing.nc_consumption + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new record
    await supabaseServer
      .from('daily_stock_consumption')
      .insert({
        date: today,
        item_id: inventoryItem.id,
        item_name: itemName,
        nc_consumption: quantity,
        regular_consumption: 0,
        staff_meal_consumption: 0
      });
  }

  // Update inventory stock
  const newStock = Math.max(0, inventoryItem.stock - quantity);
  await supabaseServer
    .from('inventory_items')
    .update({ stock: newStock })
    .eq('id', inventoryItem.id);

  // Log stock movement
  await supabaseServer
    .from('stock_logs')
    .insert({
      item_id: inventoryItem.id,
      action: 'out',
      quantity: quantity,
      note: `NC consumption: ${itemName}`,
      department: 'restaurant'
    });
}