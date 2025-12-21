import { supabase } from '@/lib/supabaseClient'

export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  vendor_id: string | null
  stock: number
  unit_price: number
  last_restocked: string | null
  source: string | null
  source_type: string | null
  source_details: any | null
  created_at?: string
  threshold?: number
}

export interface StockUsage {
  id: string
  purchase_id: string | null
  item_id: string
  quantity: number
  department: string
  note: string
  created_at: string
  created_by: string | null
}

export interface StockLog {
  id: string
  item_id: string
  action: 'in' | 'out'
  quantity: number
  note: string
  created_by: string | null
  created_at: string
  department?: string
}

export interface Vendor {
  id: string
  name: string
  phone: string | null
  email: string | null
  gst_number: string | null
  address: string | null
}

export async function getInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getInventoryItem(id: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createInventoryItem(item: Partial<InventoryItem>) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([{
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock: item.stock || 0,
      unit_price: item.unit_price || 0,
      threshold: item.threshold || 10,
      last_restocked: new Date().toISOString().split('T')[0],
      source: item.source,
      source_type: item.source_type,
      source_details: item.source_details
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStock(
  itemId: string, 
  quantity: number, 
  action: 'in' | 'out',
  note: string,
  department?: string
) {
  // Start transaction
  const { data: item, error: fetchError } = await supabase
    .from('inventory_items')
    .select('stock')
    .eq('id', itemId)
    .single()

  if (fetchError) throw fetchError

  const newStock = action === 'in' 
    ? item.stock + quantity 
    : Math.max(0, item.stock - quantity)

  // Update inventory item
  const { data: updatedItem, error: updateError } = await supabase
    .from('inventory_items')
    .update({ stock: newStock })
    .eq('id', itemId)
    .select()
    .single()

  if (updateError) throw updateError

  // Create stock log
  const { error: logError } = await supabase
    .from('stock_logs')
    .insert([{
      item_id: itemId,
      action,
      quantity,
      note,
      department,
      created_at: new Date().toISOString()
    }])

  if (logError) throw logError

  return updatedItem
}

export async function getStockLogs(itemId?: string) {
  let query = supabase
    .from('stock_logs')
    .select(`
      *,
      inventory_items (
        name,
        category,
        unit
      )
    `)
    .order('created_at', { ascending: false })

  if (itemId) {
    query = query.eq('item_id', itemId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getLowStockItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .lt('stock', supabase.raw('threshold'))

  if (error) throw error
  return data || []
}

export async function createStockUsage(data: {
  item_id: string
  quantity: number
  department: string
  note: string
  purchase_id?: string
}) {
  // First, check if we have enough stock
  const { data: item, error: fetchError } = await supabase
    .from('inventory_items')
    .select('stock')
    .eq('id', data.item_id)
    .single()

  if (fetchError) throw fetchError

  if (item.stock < data.quantity) {
    throw new Error(`Insufficient stock. Available: ${item.stock}`)
  }

  // Use the stock
  await updateStock(
    data.item_id,
    data.quantity,
    'out',
    `${data.quantity} ${data.department === 'kitchen' ? 'used in kitchen' : `used for ${data.department}`}`,
    data.department
  )

  // Record usage
  const { data: usage, error } = await supabase
    .from('purchase_stock_usage')
    .insert([{
      ...data,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return usage
}

export async function getStockUsage(department?: string) {
  let query = supabase
    .from('purchase_stock_usage')
    .select(`
      *,
      inventory_items (
        name,
        category,
        unit
      )
    `)
    .order('created_at', { ascending: false })

  if (department) {
    query = query.eq('department', department)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}