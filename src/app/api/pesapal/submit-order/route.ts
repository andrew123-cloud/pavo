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

    if (response.error) {
        return NextResponse.json({ error: response.error.message || 'An error occurred' }, { status: Number(response.error.code) || 500 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
