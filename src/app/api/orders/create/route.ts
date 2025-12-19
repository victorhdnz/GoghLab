import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const {
      order_number,
      user_id,
      subtotal,
      shipping_cost,
      total,
      payment_method,
      shipping_address,
      items,
    } = body

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        user_id,
        status: 'pending',
        subtotal,
        shipping_cost,
        total,
        payment_method,
        payment_status: 'pending',
        shipping_address,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Criar itens do pedido
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      color_id: item.color_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      is_gift: item.is_gift || false,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Atualizar estoque dos produtos (baixa automática)
    for (const item of items) {
      if (!item.is_gift) {
        // Buscar produto atual
        const { data: product } = await supabase
          .from('products')
          .select('stock, id')
          .eq('id', item.product_id)
          .single()

        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity)
          
          // Atualizar estoque
          await supabase
            .from('products')
            .update({ 
              stock: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id)

          console.log(`Estoque atualizado: Produto ${item.product_id} - ${product.stock} → ${newStock} (venda de ${item.quantity} unidades)`)
        }

        // Se tiver cor, atualizar estoque da cor também
        if (item.color_id) {
          const { data: color } = await supabase
            .from('product_colors')
            .select('stock')
            .eq('id', item.color_id)
            .single()

          if (color) {
            const newColorStock = Math.max(0, (color.stock || 0) - item.quantity)
            
            await supabase
              .from('product_colors')
              .update({ 
                stock: newColorStock,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.color_id)

            console.log(`Estoque da cor atualizado: Cor ${item.color_id} - ${color.stock} → ${newColorStock} (venda de ${item.quantity} unidades)`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Pedido criado com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao criar pedido',
      },
      { status: 500 }
    )
  }
}

