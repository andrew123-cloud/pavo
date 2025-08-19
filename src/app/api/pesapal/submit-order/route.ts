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

    if (response.error) {
        // This case is for errors returned by the submitOrder function itself (e.g. auth failed)
        return NextResponse.json({ error: response.error_message || 'An error occurred during order submission.' }, { status: 500 });
    }
    
    // Pesapal API can also return an error object in a 200 OK response
    if(response.order_tracking_id) {
       return NextResponse.json(response);
    } else {
       const errorMessage = response.error?.message || "Unknown error from Pesapal during order submission.";
       return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    

  } catch (error: any) {
     console.error("[PESAPAL_SUBMIT_ORDER_ROUTE_ERROR]", error.message);
     return NextResponse.json({ error: error.message || "An internal server error occurred." }, { status: 500 });
  }
}
