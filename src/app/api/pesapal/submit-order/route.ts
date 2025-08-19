// src/app/api/pesapal/submit-order/route.ts
import { submitOrder } from '@/lib/pesapal';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received checkout request with body:", body);

    const { amount, billing_address, description } = body;

    if (!amount || !billing_address || !description) {
      return NextResponse.json({ error: "Missing required fields: amount, billing_address, and description are required." }, { status: 400 });
    }

    const response = await submitOrder({ amount, billing_address, description });

    return NextResponse.json(response);
  } catch (error: any) {
     console.error("[PESAPAL_SUBMIT_ORDER_ROUTE_ERROR]", error.message);
     // Return a clear error message to the frontend
     return NextResponse.json({ error: error.message || "An internal server error occurred." }, { status: 500 });
  }
}
