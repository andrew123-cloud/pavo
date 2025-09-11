// src/app/api/cart/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCartWithItems(cartId: string) {
    const { data, error } = await supabase
        .from('carts')
        .select(`
            id,
            user_id,
            cart_items (
                id,
                product_id,
                quantity,
                products ( name, price, image_url, aiHint, stock, category )
            )
        `)
        .eq('id', cartId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
      throw error;
    }

    if (!data) return { id: cartId, user_id: null, cart_items: [] };

    // Transform the data to match the CartItem structure
    const transformedItems = data.cart_items.map((item: any) => ({
      id: item.product_id,
      name: item.products.name,
      price: item.products.price,
      imageUrl: item.products.image_url,
      aiHint: item.products.aiHint,
      stock: item.products.stock,
      category: item.products.category,
      quantity: item.quantity,
      cart_item_id: item.id, // Keep the original cart_item id for updates/deletes
    }));
    
    return { ...data, cart_items: transformedItems };
}


// GET /api/cart?cartId=...
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');

    if (!cartId) {
        return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
    }

    try {
        const cart = await getCartWithItems(cartId);
        return NextResponse.json(cart, { status: 200 });
    } catch (error: any) {
        console.error("Cart GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// POST /api/cart
// Adds an item to the cart, or increments its quantity
export async function POST(request: NextRequest) {
    const { cartId, productId, quantity } = await request.json();
    
    if (!cartId || !productId || !quantity) {
        return NextResponse.json({ error: 'cartId, productId, and quantity are required' }, { status: 400 });
    }

    try {
        // Ensure cart exists
        const { error: cartError } = await supabase.from('carts').upsert({ id: cartId }, { onConflict: 'id' });
        if (cartError) throw cartError;

        // Check if item already in cart
        const { data: existingItem, error: findError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cartId)
            .eq('product_id', productId)
            .single();

        if (findError && findError.code !== 'PGRST116') throw findError;

        if (existingItem) {
            // Update quantity
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: existingItem.quantity + quantity })
                .eq('id', existingItem.id);
            if (updateError) throw updateError;
        } else {
            // Add new item
            const { error: insertError } = await supabase
                .from('cart_items')
                .insert({ cart_id: cartId, product_id: productId, quantity: quantity });
            if (insertError) throw insertError;
        }

        const updatedCart = await getCartWithItems(cartId);
        return NextResponse.json(updatedCart, { status: 200 });

    } catch (error: any) {
        console.error("Cart POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// PUT /api/cart
// Updates an item's quantity in the cart
export async function PUT(request: NextRequest) {
    const { cartId, productId, quantity } = await request.json();

    if (!cartId || !productId || quantity === undefined) {
        return NextResponse.json({ error: 'cartId, productId, and quantity are required' }, { status: 400 });
    }
    
    try {
        if (quantity <= 0) {
             const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cartId)
                .eq('product_id', productId);
             if (deleteError) throw deleteError;
        } else {
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity })
                .eq('cart_id', cartId)
                .eq('product_id', productId);
            if (updateError) throw updateError;
        }

        const updatedCart = await getCartWithItems(cartId);
        return NextResponse.json(updatedCart, { status: 200 });

    } catch (error: any) {
        console.error("Cart PUT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// DELETE /api/cart?cartId=...&productId=...
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');
    const productId = searchParams.get('productId');
    const clear = searchParams.get('clear');

    if (!cartId) {
        return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
    }
    
    try {
        if(clear === 'true') {
            const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cartId);
            if(deleteError) throw deleteError;
        } else {
             if (!productId) {
                return NextResponse.json({ error: 'productId is required for item deletion' }, { status: 400 });
            }
            const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cartId)
                .eq('product_id', Number(productId));
            if(deleteError) throw deleteError;
        }

        const updatedCart = await getCartWithItems(cartId);
        return NextResponse.json(updatedCart, { status: 200 });

    } catch(error: any) {
        console.error("Cart DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
