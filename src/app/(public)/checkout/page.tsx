// src/app/(public)/checkout/page.tsx
'use client';
import { usePavoData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Loader2, Lock, Smartphone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import axios from 'axios';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';


const paymentMethods = [
    { id: 'mpesa', name: 'M-Pesa', image: 'https://placehold.co/100x60/1e293b/ffffff.png?text=M-Pesa' },
    { id: 'airtel', name: 'Airtel Money', image: 'https://placehold.co/100x60/1e293b/ffffff.png?text=Airtel' },
    { id: 'tigo', name: 'Tigo Pesa', image: 'https://placehold.co/100x60/1e293b/ffffff.png?text=Tigo' },
    { id: 'halopesa', name: 'HaloPesa', image: 'https://placehold.co/100x60/1e293b/ffffff.png?text=HaloPesa' },
];


export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = usePavoData();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0].name);

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const billing_address = {
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        email_address: formData.get('email'),
        phone_number: formData.get('phone'),
    };
    
    const paymentMethod = formData.get('paymentMethod');

    try {
        const response = await axios.post('/api/pesapal/submit-order', {
            amount: cartTotal + 5000, // Including shipping
            billing_address,
            description: `Payment for Pavo Decors order via ${paymentMethod}`
        });
        
        if (response.data && response.data.error) {
            throw new Error(response.data.error);
        }

        if (response.data && response.data.redirect_url) {
             router.push(response.data.redirect_url);
        } else {
             throw new Error("Missing redirect URL from Pesapal.");
        }

    } catch (error: any) {
        console.error("Checkout Error:", error);
        const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        setIsLoading(false);
    }
  };

  if (cart.length === 0 && !isLoading) { // prevent flicker on redirect
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
            Complete your purchase securely with Pesapal.
          </p>
        </div>
        {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="space-y-8">
                     <Card className="bg-black/30 border-white/10">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Billing Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" placeholder="Palvin" required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" placeholder="Atugonza" required/>
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="palvin@pavo.com" required/>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="phone">Phone Number (for payment)</Label>
                                <Input id="phone" name="phone" placeholder="e.g. 255712345678" required/>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="bg-black/30 border-white/10">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Payment Method</CardTitle>
                            <CardDescription>Select your preferred mobile money provider. You will confirm on the next page.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <RadioGroup name="paymentMethod" defaultValue={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="grid grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <Label key={method.id} htmlFor={method.id} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <RadioGroupItem value={method.name} id={method.id} className="sr-only"/>
                                        <Image src={method.image} alt={method.name} width={80} height={40} data-ai-hint="payment logo" />
                                        <span className="mt-2 font-medium">{method.name}</span>
                                    </Label>
                                ))}
                           </RadioGroup>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="lg:col-span-1">
                <Card className="bg-black/30 border-white/10 sticky top-28">
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
                        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</>
                            ) : (
                                <><Lock className="mr-2 h-4 w-4" /> Pay with {selectedPaymentMethod}</>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                           You will be redirected to Pesapal to complete your payment.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </form>
      </div>
    </div>
  );
}
