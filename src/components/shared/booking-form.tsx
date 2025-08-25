// src/components/shared/booking-form.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { handleBooking } from '@/app/actions/booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        'Book My Consultation'
      )}
    </Button>
  );
}

export function BookingForm() {
  const initialState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useActionState(handleBooking, initialState);

  if (state.success) {
    return (
      <Alert className="border-green-500 text-green-700">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700 font-bold">Booking Request Sent!</AlertTitle>
        <AlertDescription>
          Thank you for your interest! We have received your request and will contact you within 2 business days to schedule your consultation.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-background/50 border-white/10 p-2 sm:p-6">
      <CardContent className="p-0">
        <form action={dispatch} className="space-y-6">
          {state.errors?.server && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription>{state.errors.server[0]}</AlertDescription>
              </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Amina Juma" required />
                 {state.errors?.name && (
                    <p className="text-sm font-medium text-destructive">{state.errors.name[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="amina@example.com" required />
                 {state.errors?.email && (
                    <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>
                )}
              </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service of Interest</Label>
            <Select name="service" required>
                <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="consultation">Interior Design Consultation</SelectItem>
                    <SelectItem value="styling">Full Home Styling</SelectItem>
                    <SelectItem value="edecor">E-Decor & Virtual Design</SelectItem>
                </SelectContent>
            </Select>
             {state.errors?.service && (
                <p className="text-sm font-medium text-destructive">{state.errors.service[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Tell us about your project</Label>
            <Textarea
              id="details"
              name="details"
              placeholder="e.g., I want to redesign my living room to be more modern and minimalist. My budget is..."
              rows={5}
              required
            />
             {state.errors?.details && (
                <p className="text-sm font-medium text-destructive">{state.errors.details[0]}</p>
            )}
          </div>
          
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
