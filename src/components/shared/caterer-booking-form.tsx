
// src/components/shared/caterer-booking-form.tsx
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

const catererBookingSchema = z.object({
  customerName: z.string().min(3, "Please enter a valid full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  eventDate: z.date({ required_error: "An event date is required."}),
  eventTime: z.string().min(1, "Please specify the event time."),
  eventLocation: z.string().min(3, "Please provide the event location."),
  guests: z.string().min(1, "Please enter the number of guests."),
  menuSelection: z.string().min(3, "Please provide some menu preferences."),
  serviceType: z.string().min(1, "Please select a service type."),
  equipmentNeeds: z.string().optional(),
  budget: z.string().optional(),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof catererBookingSchema>;

export function CatererBookingForm({ siteName }: { siteName: string }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(catererBookingSchema),
        defaultValues: { customerName: "", email: "", phone: "", guests: "10" },
    });
    
    const handleSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setServerError(null);

        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_CATERER;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            const errorMsg = "Email configuration for catering bookings is missing.";
            console.error(errorMsg);
            setServerError(errorMsg);
            setIsSubmitting(false);
            return;
        }
        
        const templateParams = {
            ...data,
            siteName,
            eventDate: format(data.eventDate, 'PPP'),
        };

        try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey);
            toast({ title: "Catering Request Sent!", description: `Your request for ${siteName} has been received.` });
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
            <AlertTitle className="text-green-700 font-bold">Catering Request Sent!</AlertTitle>
            <AlertDescription>
              Thank you! We have received your request for {siteName} and will send you a detailed quotation shortly.
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
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="jane.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+255 712 345 678" {...field} /></FormControl><FormMessage /></FormMessage>
                    )}/>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Event Date</FormLabel>
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
                    <FormField control={form.control} name="eventTime" render={({ field }) => (
                         <FormItem><FormLabel>Event Time</FormLabel><FormControl><Input placeholder="e.g. 7:00 PM" {...field} /></FormControl><FormMessage /></FormItem>
                     )}/>
                </div>
                <FormField control={form.control} name="eventLocation" render={({ field }) => (
                    <FormItem><FormLabel>Event Location / Address</FormLabel><FormControl><Input placeholder="e.g. Masaki, Dar es Salaam" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="guests" render={({ field }) => (
                        <FormItem><FormLabel>Number of Guests</FormLabel><FormControl><Input type="number" placeholder="e.g. 50" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="serviceType" render={({ field }) => (
                         <FormItem>
                             <FormLabel>Type of Service</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                 <FormControl>
                                     <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                     <SelectItem value="buffet">Buffet</SelectItem>
                                     <SelectItem value="plated">Plated Dinner</SelectItem>
                                     <SelectItem value="cocktail">Cocktail / Canapés</SelectItem>
                                     <SelectItem value="drop-off">Drop-off Delivery</SelectItem>
                                 </SelectContent>
                             </Select>
                             <FormMessage />
                         </FormItem>
                     )}/>
                </div>
                 <FormField control={form.control} name="menuSelection" render={({ field }) => (
                    <FormItem><FormLabel>Menu Selection / Preferences</FormLabel><FormControl><Textarea placeholder="e.g. Swahili cuisine, vegan options, dessert station" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="equipmentNeeds" render={({ field }) => (
                        <FormItem><FormLabel>Equipment Needs (optional)</FormLabel><FormControl><Input placeholder="e.g. Tables, chairs, tents" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="budget" render={({ field }) => (
                        <FormItem><FormLabel>Budget / Quotation (optional)</FormLabel><FormControl><Input placeholder="e.g. 5M TZS" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="specialRequests" render={({ field }) => (
                    <FormItem><FormLabel>Special Requests / Notes (optional)</FormLabel><FormControl><Textarea placeholder="e.g. Dietary restrictions, theme" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting...</> : 'Request Quotation'}
                </Button>
            </form>
        </Form>
    );
}
    