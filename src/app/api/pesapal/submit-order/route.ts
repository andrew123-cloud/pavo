// src/app/api/pesapal/submit-order/route.ts
import { submitOrder } from '@/lib/pesapal';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, billing_address, description } = await request.json();

    if (!amount || !billing_address || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const response = await submitOrder({ amount, billing_address, description });

    // Pesapal's successful response doesn't have an 'error' key at the top level.
    // It will have 'order_tracking_id', 'merchant_reference', and 'redirect_url'.
    // The error structure from them is { "error": { "code": "...", "message": "...", "error_data": null } }
    if (response.error) {
        console.error("[PESAPAL_API_ERROR]", response.error);
        return NextResponse.json({ error: response.error.message || 'An error occurred during payment submission.' }, { status: Number(response.error.code) || 500 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
     console.error("[PESAPAL_SUBMIT_ORDER_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
