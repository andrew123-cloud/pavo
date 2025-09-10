
// src/app/(public)/bookings/page.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  UtensilsCrossed,
  ConciergeBell,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePavoData } from '@/context/data-context';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function PavoBookingsPage() {
  const { siteSettings } = usePavoData();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = siteSettings.heroImages.homes;

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % heroImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);


  return (
    <div className="flex flex-col dark bg-background text-foreground">
      <section className="relative h-[70vh] min-h-[450px] w-full">
        {heroImages.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt="A beautiful and aesthetic venue in Tanzania"
            layout="fill"
            objectFit="cover"
            className={`transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-30' : 'opacity-0'}`}
            data-ai-hint="tanzania venue"
            priority={index === 0}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Pavo Bookings
          </Badge>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Reserve Your Perfect Experience
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground/80 md:text-xl">
            Book unique homes, exquisite dining, and professional catering services all in one place.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-24 -mt-24 relative z-10">
        <div className="container mx-auto px-4">
            <Tabs defaultValue="homes" className="w-full max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-3 h-16">
                    <TabsTrigger value="homes" className="h-full text-lg"><Home className="mr-2"/> Homes</TabsTrigger>
                    <TabsTrigger value="restaurants" className="h-full text-lg"><UtensilsCrossed className="mr-2"/> Restaurants</TabsTrigger>
                    <TabsTrigger value="catering" className="h-full text-lg"><ConciergeBell className="mr-2"/> Catering</TabsTrigger>
                </TabsList>

                <Card className="mt-4 bg-background/80 backdrop-blur-sm border-0 shadow-2xl">
                    <TabsContent value="homes" className="p-0">
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl">Find a Home</CardTitle>
                            <CardDescription>Search for your perfect stay in Tanzania.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
                                <div className="space-y-2 text-left md:col-span-2">
                                    <Label htmlFor="location">Location</Label>
                                    <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input id="location" placeholder="e.g., Zanzibar, Arusha..." className="pl-10 h-12" />
                                    </div>
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="checkin">Check in</Label>
                                    <Input id="checkin" type="date" className="h-12" />
                                </div>
                                <Button size="lg" className="w-full h-12">
                                    <Search className="mr-2 h-5 w-5" /> Search
                                </Button>
                            </form>
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="restaurants" className="p-0">
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl">Book a Restaurant</CardTitle>
                            <CardDescription>Reserve a table for your next dining experience.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="diners">Number of Diners</Label>
                                    <Input id="diners" type="number" placeholder="2" className="h-12" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="res-date">Date</Label>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                             <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !true && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                <span>Pick a date</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                                 <div className="space-y-2 text-left">
                                    <Label htmlFor="res-time">Time</Label>
                                    <Input id="res-time" type="time" className="h-12" />
                                </div>
                                <div className="md:col-span-3">
                                     <Button size="lg" className="w-full h-12">
                                        <Search className="mr-2 h-5 w-5" /> Find a Table
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="catering" className="p-0">
                         <CardHeader>
                            <CardTitle className="font-headline text-3xl">Book Catering</CardTitle>
                            <CardDescription>Let us handle the food for your special event.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="event-type">Type of Event</Label>
                                    <Select>
                                        <SelectTrigger className="h-12"><SelectValue placeholder="Select event type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="wedding">Wedding</SelectItem>
                                            <SelectItem value="corporate">Corporate</SelectItem>
                                            <SelectItem value="party">Private Party</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="guests">Number of Guests</Label>
                                    <Input id="guests" type="number" placeholder="50" className="h-12" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="event-date">Date of Event</Label>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                             <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !true && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                <span>Pick a date</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                                 <div className="md:col-span-3">
                                     <Button size="lg" className="w-full h-12">
                                        <Search className="mr-2 h-5 w-5" /> Get a Quote
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </TabsContent>
                </Card>
            </Tabs>
        </div>
      </section>
    </div>
  );
}
