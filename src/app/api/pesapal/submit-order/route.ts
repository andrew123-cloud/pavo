// src/app/api/pesapal/submit-order/route.ts
import { submitOrder } from "@/lib/pesapal";
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

    // The new submitOrder function will throw an error on failure, which will be caught below.
    // A successful response will always have a redirect_url.
    return NextResponse.json(response);

  } catch (error: any) {
     const errorMessage = error.message || "An internal server error occurred.";
     console.error("[PESAPAL_SUBMIT_ORDER_ROUTE_ERROR]", errorMessage);
     // Return the specific error message from the library
     return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
