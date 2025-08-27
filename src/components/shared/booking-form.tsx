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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, CheckCircle2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting Request...
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
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [completionDate, setCompletionDate] = useState<Date>();

  if (state.success) {
    return (
      <Alert className="border-green-500 text-green-700">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700 font-bold">Booking Request Sent!</AlertTitle>
        <AlertDescription>
          Thank you for your interest! We have received your detailed request and will contact you within 2 business days to schedule your consultation.
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
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" placeholder="Amina Juma" required />
                 {state.errors?.fullName && (
                    <p className="text-sm font-medium text-destructive">{state.errors.fullName[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="amina@example.com" required />
                 {state.errors?.email && (
                    <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>
                )}
              </div>
          </div>
          
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="+255 712 345 678" required />
                 {state.errors?.phone && (
                    <p className="text-sm font-medium text-destructive">{state.errors.phone[0]}</p>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="location">Location of Property</Label>
                <Input id="location" name="location" placeholder="e.g. Masaki, Dar es Salaam" required />
                 {state.errors?.location && (
                    <p className="text-sm font-medium text-destructive">{state.errors.location[0]}</p>
                )}
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="propertyType">Type of Property</Label>
                <Select name="propertyType" required>
                    <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                 {state.errors?.propertyType && (<p className="text-sm font-medium text-destructive">{state.errors.propertyType[0]}</p>)}
            </div>
             <div className="space-y-2">
                <Label htmlFor="spaceToBeDesigned">Space to Be Designed</Label>
                <Input id="spaceToBeDesigned" name="spaceToBeDesigned" placeholder="e.g. Living room, entire house" required />
                {state.errors?.spaceToBeDesigned && (<p className="text-sm font-medium text-destructive">{state.errors.spaceToBeDesigned[0]}</p>)}
            </div>
          </div>
          
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="size">Approximate Size/Area</Label>
                <Input id="size" name="size" placeholder="e.g. 150 sq. m." required />
                {state.errors?.size && (<p className="text-sm font-medium text-destructive">{state.errors.size[0]}</p>)}
            </div>
             <div className="space-y-2">
                <Label htmlFor="status">Current Status</Label>
                 <Select name="status" required>
                    <SelectTrigger><SelectValue placeholder="Select project status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="new build">New Build</SelectItem>
                        <SelectItem value="renovation">Renovation</SelectItem>
                        <SelectItem value="furnishing only">Furnishing Only</SelectItem>
                        <SelectItem value="consultation">Consultation Stage</SelectItem>
                    </SelectContent>
                </Select>
                 {state.errors?.status && (<p className="text-sm font-medium text-destructive">{state.errors.status[0]}</p>)}
            </div>
          </div>
          
           <div className="space-y-2">
                <Label htmlFor="style">Preferred Design Style</Label>
                <Input id="style" name="style" placeholder="e.g. Modern, Minimalist, Coastal" required />
                {state.errors?.style && (<p className="text-sm font-medium text-destructive">{state.errors.style[0]}</p>)}
            </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="budget">Budget Range</Label>
                    <Input id="budget" name="budget" placeholder="e.g. 10M - 15M TZS" required />
                    {state.errors?.budget && (<p className="text-sm font-medium text-destructive">{state.errors.budget[0]}</p>)}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="completionDate">Preferred Completion Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !completionDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {completionDate ? format(completionDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={completionDate} onSelect={setCompletionDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <input type="hidden" name="completionDate" value={completionDate?.toISOString()} />
                     {state.errors?.completionDate && (<p className="text-sm font-medium text-destructive">{state.errors.completionDate[0]}</p>)}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="servicesRequired">Services Required</Label>
                 <Select name="servicesRequired" required>
                    <SelectTrigger><SelectValue placeholder="Select required services" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="consultation only">Consultation Only</SelectItem>
                        <SelectItem value="full design">Full Design & Execution</SelectItem>
                        <SelectItem value="furniture sourcing">Furniture Sourcing</SelectItem>
                        <SelectItem value="decor and styling">Decor & Styling</SelectItem>
                    </SelectContent>
                </Select>
                 {state.errors?.servicesRequired && (<p className="text-sm font-medium text-destructive">{state.errors.servicesRequired[0]}</p>)}
            </div>
            
            <div className="space-y-2">
                 <Label htmlFor="preferredDate">Preferred Date for Consultation</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !preferredDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {preferredDate ? format(preferredDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={preferredDate} onSelect={setPreferredDate} initialFocus />
                    </PopoverContent>
                </Popover>
                 <input type="hidden" name="preferredDate" value={preferredDate?.toISOString()} />
                 {state.errors?.preferredDate && (<p className="text-sm font-medium text-destructive">{state.errors.preferredDate[0]}</p>)}
            </div>

            <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
