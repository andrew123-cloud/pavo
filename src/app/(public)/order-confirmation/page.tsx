// src/app/(public)/order-confirmation/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import { usePavoData } from '@/context/data-context';
import type { Order } from '@/lib/types';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const { orders } = usePavoData();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderTrackingId && orders.length > 0) {
      const foundOrder = orders.find(o => o.pesapal_order_tracking_id === orderTrackingId);
      if (foundOrder) {
        setOrder(foundOrder);
      }
    }
    // Simulate loading for effect even if order not found immediately
    setTimeout(() => setIsLoading(false), 1500);
  }, [orderTrackingId, orders]);

  if (isLoading) {
    return (
        <div className="dark bg-background text-foreground min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-24 w-24 text-primary mx-auto animate-spin" />
                <h1 className="mt-6 font-headline text-4xl font-bold">Finalizing your order...</h1>
            </div>
        </div>
    )
  }

  if (!order) {
     return (
         <div className="dark bg-background text-foreground min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="font-headline text-4xl font-bold">Could not find your order.</h1>
                 <p className="mt-4 text-lg text-muted-foreground">
                   It might still be processing. Please check your dashboard later.
                 </p>
                 <Button asChild size="lg" className="mt-8">
                   <Link href="/decors">Continue Shopping</Link>
                 </Button>
            </div>
        </div>
     )
  }


  const getStatusBadge = (statusCode: number) => {
    switch (statusCode) {
      case 1: return <Badge variant="default" className="bg-green-600">COMPLETED</Badge>;
      case 2: return <Badge variant="destructive">FAILED</Badge>;
      case 3: return <Badge variant="secondary">REVERSED</Badge>;
      default: return <Badge variant="outline">INVALID/PENDING</Badge>;
    }
  };

  return (
    <div className="dark bg-background text-foreground min-h-screen flex items-center justify-center">
      <div className="container mx-auto max-w-3xl px-4 py-16 md:py-24 text-center">
          <CheckCircle2 className="h-24 w-24 text-primary mx-auto" />
           <h1 className="mt-6 font-headline text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Thank You, {order.customer_name}!
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your order has been processed.
          </p>
          
          <Card className="mt-8 bg-black/30 border-white/10 text-left">
              <CardHeader>
                  <CardTitle className="font-headline text-2xl">Order Summary</CardTitle>
                  <CardDescription>Order ID: <span className="font-mono text-primary">{order.id}</span></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(order.status_code)}
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pesapal Tracking ID</span>
                      <span className="font-mono text-sm">{order.pesapal_order_tracking_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span>{order.payment_method}</span>
                  </div>
                   <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Confirmation Code</span>
                      <span className="font-mono">{order.confirmation_code}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span>{order.amount.toLocaleString()} {order.currency}</span>
                  </div>
                  <p className="mt-4 pt-4 border-t border-white/10 text-sm text-muted-foreground">You will receive an email confirmation shortly with your order details.</p>
              </CardContent>
          </Card>
          
          <Button asChild size="lg" className="mt-8">
            <Link href="/decors">Continue Shopping</Link>
          </Button>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
