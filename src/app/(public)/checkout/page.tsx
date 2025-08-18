// src/app/(public)/checkout/page.tsx
'use client';
import { usePavoData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = usePavoData();
  const router = useRouter();
  const { toast } = useToast();

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would process payment.
    toast({
        title: "Order Placed!",
        description: "Thank you for your purchase. Your order is being processed.",
    });
    const orderId = Math.random().toString(36).substr(2, 9);
    clearCart();
    router.push(`/order-confirmation?orderId=${orderId}`);
  };

  if (cart.length === 0) {
     return (
       <div className="container mx-auto max-w-lg text-center py-24">
         <h1 className="text-2xl font-bold">Your cart is empty.</h1>
         <p className="text-muted-foreground mt-2">Add items to your cart to proceed to checkout.</p>
          <Button asChild className="mt-6">
            <Link href="/decors">Go Shopping</Link>
          </Button>
       </div>
     );
  }

  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
         <div className="text-center mb-12">
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Checkout
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Complete your purchase securely.
          </p>
        </div>
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="space-y-8">
                     <Card className="bg-secondary/30 border-0">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Shipping Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="Palvin" required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Atugonza" required/>
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" placeholder="123 Pavo Street" required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" placeholder="Dar es Salaam" required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" placeholder="Tanzania" required/>
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="palvin@pavo.com" required/>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="bg-secondary/30 border-0">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Payment Details</CardTitle>
                            <CardDescription>All transactions are secure and encrypted.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="card-number">Card Number</Label>
                                <div className="relative">
                                    <Input id="card-number" placeholder="**** **** **** 1234" required/>
                                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry-date">Expiry Date</Label>
                                    <Input id="expiry-date" placeholder="MM/YY" required/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input id="cvc" placeholder="123" required/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="lg:col-span-1">
                <Card className="bg-secondary/30 border-0 sticky top-28">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Your Order</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                    <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" />
                                     <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        {item.quantity}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium">{item.name}</h3>
                                </div>
                                <div className="font-medium">
                                    {(item.price * item.quantity).toLocaleString()} TZS
                                </div>
                            </div>
                        ))}
                        <Separator />
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
                    <CardFooter className="flex-col gap-4">
                        <Button type="submit" size="lg" className="w-full">
                            <Lock className="mr-2 h-4 w-4" /> Pay {(cartTotal + 5000).toLocaleString()} TZS
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            By placing your order, you agree to the Terms of Service and Privacy Policy.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </form>
      </div>
    </div>
  );
}
