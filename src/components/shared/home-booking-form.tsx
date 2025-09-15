
// src/components/shared/home-booking-form.tsx
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
import { AlertCircle, CheckCircle2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

const homeBookingSchema = z.object({
  customerName: z.string().min(3, { message: "Please enter a valid full name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  bookingDates: z.object({
      from: z.date({ required_error: "A start date is required."}),
      to: z.date({ required_error: "An end date is required."}),
  }),
  guests: z.string().min(1, { message: "Please enter the number of guests." }),
  purpose: z.string().min(3, { message: "Please specify the purpose of your booking." }),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof homeBookingSchema>;

export function HomeBookingForm({ siteName }: { siteName: string }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(homeBookingSchema),
        defaultValues: { customerName: "", email: "", phone: "", guests: "1", purpose: "" },
    });

    const handleSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setServerError(null);

        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_HOME;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            const errorMsg = "Email configuration for home bookings is missing.";
            console.error(errorMsg);
            setServerError(errorMsg);
            setIsSubmitting(false);
            return;
        }

        const templateParams = {
            ...data,
            siteName,
            bookingDates: `From: ${format(data.bookingDates.from, 'PPP')} To: ${format(data.bookingDates.to, 'PPP')}`
        };

        try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey);
            toast({ title: "Booking Request Sent!", description: `Your request for ${siteName} has been received.` });
            setIsSuccess(true);
            form.reset();
        } catch (error) {
            console.error("EmailJS failed to send:", error);
            const errorMsg = "There was an issue submitting your request. Please try again later.";
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
            <AlertTitle className="text-green-700 font-bold">Booking Request Sent!</AlertTitle>
            <AlertDescription>
              Thank you for your interest in {siteName}. We will review your request and contact you shortly to confirm the booking.
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
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Amina Juma" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="amina@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+255 712 345 678" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField
                    control={form.control}
                    name="bookingDates"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Booking Dates (Start - End)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.from ? (
                                        field.value.to ? (
                                        <>
                                            {format(field.value.from, "LLL dd, y")} -{" "}
                                            {format(field.value.to, "LLL dd, y")}
                                        </>
                                        ) : (
                                        format(field.value.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={field.value?.from}
                                    selected={field.value as DateRange}
                                    onSelect={field.onChange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="guests" render={({ field }) => (
                        <FormItem><FormLabel>Number of Guests</FormLabel><FormControl><Input type="number" placeholder="e.g. 4" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="purpose" render={({ field }) => (
                        <FormItem><FormLabel>Purpose of Booking</FormLabel><FormControl><Input placeholder="e.g. Wedding, Birthday, Holiday" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="specialRequests" render={({ field }) => (
                    <FormItem><FormLabel>Special Requests / Notes</FormLabel><FormControl><Textarea placeholder="Any special requirements..." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</> : 'Submit Booking Request'}
                </Button>
            </form>
        </Form>
    );
}

    