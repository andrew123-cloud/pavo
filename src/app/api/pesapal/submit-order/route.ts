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

    return NextResponse.json(response);
  } catch (error: any) {
     console.error("[PESAPAL_SUBMIT_ORDER_ERROR]", error);
     // Pass the specific error message from the pesapal library
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
