// src/app/api/pesapal/status/route.ts
import { getTransactionStatus } from '@/lib/pesapal';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get('orderTrackingId');

  if (!orderTrackingId) {
    return NextResponse.json({ error: 'orderTrackingId is required' }, { status: 400 });
  }

  try {
    const status = await getTransactionStatus(orderTrackingId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
