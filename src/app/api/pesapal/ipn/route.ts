// src/app/api/pesapal/ipn/route.ts
import { getTransactionStatus } from '@/lib/pesapal';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderNotificationType = searchParams.get('OrderNotificationType');
  const orderTrackingId = searchParams.get('OrderTrackingId');
  
  console.log('Pesapal IPN Received:', { orderNotificationType, orderTrackingId });

  if (orderTrackingId) {
    // You should ideally have a robust queueing system here in a production app.
    // For this example, we'll just log it.
    // In a real app, you would fetch status and update your DB.
    console.log(`Received IPN for OrderTrackingId: ${orderTrackingId}. Checking status...`);
    try {
        const status = await getTransactionStatus(orderTrackingId);
        console.log('IPN Transaction Status:', status);
        // Here you would find the order in your database using orderTrackingId
        // and update its status based on `status.status_code`.
    } catch(error) {
        console.error("Error fetching status from IPN:", error);
    }
  }

  // Acknowledge receipt to Pesapal
  const response = {
    orderNotificationType: 'IPN_CHANGE_NOTIFICATION',
    orderTrackingId: orderTrackingId,
    status: 'COMPLETED', // Or 'FAILED' or 'INVALID' as appropriate
  };

  return NextResponse.json(response);
}
