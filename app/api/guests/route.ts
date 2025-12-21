import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, address, idProof } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    if (phone.length < 10) {
      return NextResponse.json(
        { error: 'Phone number must be at least 10 digits' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First check if guest already exists
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingGuest) {
      // Update existing guest
      const { data, error } = await supabase
        .from('guests')
        .update({
          name,
          address: address || '',
          id_proof: idProof || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGuest.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase update error:', error)
        return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // Create new guest
      const { data, error } = await supabase
        .from('guests')
        .insert({
          name,
          phone,
          address: address || '',
          id_proof: idProof || '',
          created_at: new Date().toISOString(),
          status: 'checked-in'
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 })
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error in guest creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}