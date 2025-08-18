// src/app/(public)/order-confirmation/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="dark bg-background text-foreground min-h-screen flex items-center justify-center">
      <div className="container mx-auto max-w-2xl px-4 py-16 md:py-24 text-center">
          <CheckCircle2 className="h-24 w-24 text-primary mx-auto" />
           <h1 className="mt-6 font-headline text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Thank You!
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your order has been placed successfully.
          </p>
          {orderId && (
            <Card className="mt-8 bg-secondary/30 border-0 text-left">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Order Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your Order ID is: <span className="font-mono text-primary">{orderId}</span></p>
                    <p className="mt-2 text-muted-foreground">You will receive an email confirmation shortly with your order details and tracking information.</p>
                </CardContent>
            </Card>
          )}

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
