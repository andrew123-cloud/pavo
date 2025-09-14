
// src/app/(public)/cart/page.tsx
'use client';
import React from 'react';
import { usePavoData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, cartTotal, cartCount, loading } = usePavoData();

  if (loading) {
    return (
        <div className="dark bg-background text-foreground min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
                <h1 className="mt-6 font-headline text-3xl font-bold tracking-tight text-foreground">
                    Loading Cart...
                </h1>
            </div>
        </div>
    );
  }

  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Your Shopping Cart
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Review your items and proceed to checkout.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-secondary h-96">
            <ShoppingCart className="h-24 w-24 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-muted-foreground">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Button asChild className="mt-6">
              <Link href="/decors">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-secondary/30 border-0">
                <CardHeader>
                  <CardTitle className='font-headline text-2xl'>Your Items ({cartCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {cart.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <div className="flex items-center gap-4">
                          <div className="relative h-24 w-24 rounded-md overflow-hidden">
                            <Image src={typeof item.imageUrl === 'string' && item.imageUrl.trim() ? item.imageUrl : `https://placehold.co/100x100.png?text=No+Image`} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-muted-foreground">{item.price.toLocaleString()} TZS</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-center"
                            />
                             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="font-semibold text-lg w-28 text-right">
                            {(item.price * item.quantity).toLocaleString()} TZS
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive"/>
                          </Button>
                        </div>
                        {index < cart.length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card className="bg-secondary/30 border-0 sticky top-28">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{cartTotal.toLocaleString()} TZS</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>5,000 TZS</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{(cartTotal + 5000).toLocaleString()} TZS</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" asChild>
                        <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
