// src/components/shared/restaurant-booking-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import emailjs from '@emailjs/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { usePavoData } from '@/context/data-context';

const restaurantBookingSchema = z.object({
  customerName: z.string().min(3, "Please enter a valid full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  reservationDate: z.date({ required_error: "A reservation date is required."}),
  reservationTime: z.string().min(1, "Please select a time."),
  people: z.string().min(1, "Please enter the number of people."),
  tablePreference: z.string().optional(),
  occasion: z.string().optional(),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof restaurantBookingSchema>;

export function RestaurantBookingForm({ siteName }: { siteName: string }) {
    const { toast } = useToast();
    const { addServiceBooking } = usePavoData();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(restaurantBookingSchema),
        defaultValues: { customerName: "", email: "", phone: "", people: "2", tablePreference: "any" },
    });
    
    const handleSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setServerError(null);

        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID_2;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_RESTAURANT;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY_2;

        if (!serviceId || !templateId || !publicKey) {
            const errorMsg = "Email configuration for restaurant bookings is missing.";
            console.error(errorMsg);
            setServerError(errorMsg);
            setIsSubmitting(false);
            return;
        }

        try {
            const templateParams = {
                ...data,
                siteName,
                reservationDate: format(data.reservationDate, 'PPP'),
            };

            await emailjs.send(serviceId, templateId, templateParams, publicKey);
            
            await addServiceBooking({
                site_name: siteName,
                booking_type: 'Restaurant',
                customer_name: data.customerName,
                email: data.email,
                phone: data.phone,
                details: {
                    "Reservation Date": format(data.reservationDate, 'PPP'),
                    "Reservation Time": data.reservationTime,
                    "Number of People": data.people,
                    "Table Preference": data.tablePreference,
                    "Occasion": data.occasion,
                    "Special Requests": data.specialRequests,
                }
            });

            toast({ title: "Reservation Request Sent!", description: `Your request for ${siteName} has been received.` });
            setIsSuccess(true);
            form.reset();
        } catch (error: any) {
            console.error("Booking failed:", error);
            const errorMsg = error?.message || "There was an issue submitting your request. Please try again later.";
            setServerError(errorMsg);
            toast({ variant: "destructive", title: "Submission Failed", description: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
          <Alert className="border-green-500 text-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700 font-bold">Reservation Request Sent!</AlertTitle>
            <AlertDescription>
              Thank you for your interest in {siteName}. We will review your request and contact you shortly to confirm your table.
            </AlertDescription>
          </Alert>
        );
    }

     return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {serverError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Submission Error</AlertTitle>
                        <AlertDescription>{serverError}</AlertDescription>
                    </Alert>
                )}
                 <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField
  control={form.control}
  name="phone"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Phone</FormLabel>
      <FormControl>
        <Input placeholder="+255 712 345 678" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="reservationDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Reservation Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="reservationTime" render={({ field }) => (
                         <FormItem>
                            <FormLabel>Time</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                 <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                     <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                     <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                     <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                     <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                                     <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                                     <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                                     <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                                 </SelectContent>
                             </Select>
                             <FormMessage />
                         </FormItem>
                     )}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="people" render={({ field }) => (
                        <FormItem><FormLabel>Number of People</FormLabel><FormControl><Input type="number" placeholder="e.g. 4" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="tablePreference" render={({ field }) => (
                         <FormItem>
                             <FormLabel>Table Preference</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                 <FormControl>
                                     <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                     <SelectItem value="any">Any</SelectItem>
                                     <SelectItem value="indoor">Indoor</SelectItem>
                                     <SelectItem value="outdoor">Outdoor</SelectItem>
                                     <SelectItem value="vip">VIP Area</SelectItem>
                                 </SelectContent>
                             </Select>
                             <FormMessage />
                         </FormItem>
                     )}/>
                </div>
                <FormField control={form.control} name="occasion" render={({ field }) => (
                    <FormItem><FormLabel>Occasion (optional)</FormLabel><FormControl><Input placeholder="e.g. Birthday, Anniversary" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="specialRequests" render={({ field }) => (
                    <FormItem><FormLabel>Special Requests (optional)</FormLabel><FormControl><Textarea placeholder="e.g. Allergies, high chair needed" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting...</> : 'Request Reservation'}
                </Button>
            </form>
        </Form>
    );
}
