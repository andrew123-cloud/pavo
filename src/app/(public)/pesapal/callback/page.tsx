// src/app/(public)/pesapal/callback/page.tsx
'use client';

import { usePavoData } from '@/context/data-context';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addOrder, clearCart, cart, decreaseStock } = usePavoData();
    const { toast } = useToast();
    const [message, setMessage] = useState('Confirming your payment, please wait...');

    const orderTrackingId = searchParams.get('OrderTrackingId');

    useEffect(() => {
        if (!orderTrackingId) {
            setMessage('Invalid callback. No OrderTrackingId found.');
            return;
        }

        const checkStatus = async () => {
            try {
                const response = await axios.get(`/api/pesapal/status?orderTrackingId=${orderTrackingId}`);
                const status = response.data;
                
                if (status.error) {
                    throw new Error(status.error.message || 'Failed to get transaction status.');
                }
                
                const newOrder: Order = {
                    id: status.merchant_reference,
                    pesapal_order_tracking_id: orderTrackingId,
                    status_code: status.status_code,
                    payment_method: status.payment_method,
                    payment_account: status.payment_account,
                    merchant_reference: status.merchant_reference,
                    confirmation_code: status.confirmation_code,
                    amount: status.amount,
                    currency: status.currency,
                    created_at: status.created_date,
                    customer_name: status.billing_address?.first_name || 'Valued Customer',
                    items: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                };
                
                addOrder(newOrder);

                if (status.status_code === 1) { // COMPLETED
                    setMessage('Payment successful! Redirecting...');
                    cart.forEach(item => {
                        decreaseStock(item.id, item.quantity);
                    });
                    clearCart();
                } else {
                    setMessage('Payment was not successful. Redirecting...');
                }
                
                router.replace(`/order-confirmation?OrderTrackingId=${orderTrackingId}`);

            } catch (error: any) {
                console.error("Payment status check failed:", error);
                setMessage('Error confirming payment. Please contact support.');
                toast({
                    variant: 'destructive',
                    title: "Payment Confirmation Failed",
                    description: error.message || 'An unknown error occurred.',
                });
                router.replace('/cart');
            }
        };

        const timer = setTimeout(checkStatus, 3000);

        return () => clearTimeout(timer);

    }, [orderTrackingId, addOrder, clearCart, router, toast, cart, decreaseStock]);

    return (
        <div className="dark bg-background text-foreground min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
                <h1 className="mt-6 font-headline text-3xl font-bold tracking-tight text-foreground">
                    {message}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Please do not close or refresh this page.
                </p>
            </div>
        </div>
    );
}


export default function PesapalCallbackPage() {
    return (
        <Suspense fallback={
             <div className="dark bg-background text-foreground min-h-screen flex items-center justify-center">
                <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
             </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
