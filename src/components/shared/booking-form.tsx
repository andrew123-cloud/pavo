
// src/components/shared/booking-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import emailjs from '@emailjs/browser';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, CheckCircle2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { usePavoData } from '@/context/data-context';
import type { Booking } from '@/lib/types';


const bookingSchema = z.object({
  fullName: z.string().min(3, { message: "Please enter a valid full name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  location: z.string().min(3, { message: "Please enter a valid location." }),
  propertyType: z.enum(["residential", "commercial", "office", "hospitality", "other"]),
  spaceToBeDesigned: z.string().min(3, { message: "Please specify the space." }),
  size: z.string().min(2, { message: "Please provide an approximate size." }),
  status: z.enum(["new build", "renovation", "furnishing only", "consultation"]),
  style: z.string().min(3, { message: "Please describe your preferred style." }),
  budget: z.string().min(3, { message: "Please provide a budget range." }),
  completionDate: z.date().optional(),
  servicesRequired: z.enum(["consultation only", "full design", "furniture sourcing", "decor and styling"]),
  preferredDate: z.date({ required_error: "Please select a preferred consultation date." }),
});

type FormValues = z.infer<typeof bookingSchema>;


export function BookingForm() {
    const { toast } = useToast();
    const { addBooking } = usePavoData();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            location: "",
            spaceToBeDesigned: "",
            size: "",
            style: "",
            budget: "",
        },
    });

    const handleSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setServerError(null);

        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            console.error("EmailJS environment variables are not set!");
            setServerError("Email configuration is missing. Please contact support.");
            setIsSubmitting(false);
            return;
        }

        const formattedCompletionDate = data.completionDate ? format(data.completionDate, 'PPP') : 'Not specified';
        const formattedPreferredDate = format(data.preferredDate, 'PPP');

        const templateParams = {
            ...data,
            completionDate: formattedCompletionDate,
            preferredDate: formattedPreferredDate,
        };

        try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey);
            
            // Save the booking to the context
            const bookingData: Omit<Booking, 'id' | 'createdAt' | 'isRead'> = {
                ...data,
                completionDate: formattedCompletionDate,
                preferredDate: formattedPreferredDate,
            }
            addBooking(bookingData);

            toast({
                title: "Booking Request Sent!",
                description: "We have received your request and will contact you within 2 hours.",
            });
            setIsSuccess(true);
            form.reset();

        } catch (error) {
            console.error("EmailJS failed to send:", error);
            setServerError("There was an issue submitting your request. Please try again later.");
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "There was an issue submitting your request. Please try again later.",
            });
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
          Thank you for your interest! We have received your detailed request and will contact you within 2 hours to schedule your consultation. An email confirmation is on its way.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-background/50 border-white/10 p-2 sm:p-6">
      <CardContent className="p-0">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {serverError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Submission Error</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Amina Juma" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="amina@example.com" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+255 712 345 678" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Location of Property</FormLabel>
                        <FormControl><Input placeholder="e.g. Masaki, Dar es Salaam" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                         <FormItem>
                            <FormLabel>Type of Property</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="residential">Residential</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="office">Office</SelectItem>
                                    <SelectItem value="hospitality">Hospitality</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="spaceToBeDesigned"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Space to Be Designed</FormLabel>
                        <FormControl><Input placeholder="e.g. Living room, entire house" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Approximate Size/Area</FormLabel>
                        <FormControl><Input placeholder="e.g. 150 sq. m." {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                         <FormItem>
                            <FormLabel>Current Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select project status" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="new build">New Build</SelectItem>
                                    <SelectItem value="renovation">Renovation</SelectItem>
                                    <SelectItem value="furnishing only">Furnishing Only</SelectItem>
                                    <SelectItem value="consultation">Consultation Stage</SelectItem>
                                </SelectContent>
                            </Select>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Preferred Design Style</FormLabel>
                        <FormControl><Input placeholder="e.g. Modern, Minimalist, Coastal" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Budget Range</FormLabel>
                            <FormControl><Input placeholder="e.g. 10M - 15M TZS" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="completionDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Preferred Completion Date</FormLabel>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="servicesRequired"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Services Required</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select required services" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="consultation only">Consultation Only</SelectItem>
                                    <SelectItem value="full design">Full Design & Execution</SelectItem>
                                    <SelectItem value="furniture sourcing">Furniture Sourcing</SelectItem>
                                    <SelectItem value="decor and styling">Decor & Styling</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="preferredDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Preferred Date for Consultation</FormLabel>
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
                </div>

                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Request...
                    </>
                ) : (
                    'Book My Consultation'
                )}
                </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
