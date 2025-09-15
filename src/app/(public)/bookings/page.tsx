
// src/app/(public)/bookings/page.tsx
'use client';
import Image from 'next/image';
import {
  Home,
  UtensilsCrossed,
  ConciergeBell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePavoData } from '@/context/data-context';
import { useState, useEffect } from 'react';
import type { BookingSite } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { HomeBookingForm } from '@/components/shared/home-booking-form';
import { RestaurantBookingForm } from '@/components/shared/restaurant-booking-form';
import { CatererBookingForm } from '@/components/shared/caterer-booking-form';


const BookingSiteCard = ({ site }: { site: BookingSite }) => {
    const renderBookingForm = () => {
        switch (site.type) {
            case 'home':
                return <HomeBookingForm siteName={site.name} />;
            case 'restaurant':
                return <RestaurantBookingForm siteName={site.name} />;
            case 'caterer':
                return <CatererBookingForm siteName={site.name} />;
            default:
                return <p>Booking form not available for this type.</p>;
        }
    }
    
    return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 bg-secondary/50 border-0 flex flex-col">
        <CardContent className="p-0 flex-grow">
            <div className="group">
                <div className="relative h-64 w-full overflow-hidden">
                    {(site.imageUrls?.length || 0) > 0 ? (
                      <Carousel className="w-full h-full">
                          <CarouselContent>
                              {site.imageUrls.map((url, index) => (
                                  <CarouselItem key={index}>
                                      <div className="relative h-64 w-full">
                                          <img
                                              src={typeof url === 'string' && url.trim() ? url : 'https://placehold.co/400x250.png?text=Image+Not+Available'}
                                              alt={`${site.name} image ${index + 1}`}
                                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                              data-ai-hint={site.aiHint}
                                          />
                                      </div>
                                  </CarouselItem>
                              ))}
                          </CarouselContent>
                          {site.imageUrls.length > 1 && (
                              <>
                                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                              </>
                          )}
                      </Carousel>
                    ) : (
                       <img
                          src={'https://placehold.co/400x250.png?text=Image+Not+Available'}
                          alt={site.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          data-ai-hint={site.aiHint}
                      />
                    )}
                    {site.location && <Badge className="absolute left-3 top-3 bg-primary/80 text-primary-foreground backdrop-blur-sm">{site.location}</Badge>}
                </div>
                <div className="p-4 text-left">
                    <h3 className="mt-2 font-headline font-semibold text-xl text-foreground">{site.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{site.description}</p>
                    {site.priceInfo && <p className="text-md font-semibold text-primary mt-2">{site.priceInfo}</p>}
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="secondary" size="lg" className="w-full">Book Now</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Book: {site.name}</DialogTitle>
                        <DialogDescription>
                            Please fill out the form below to complete your booking.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='py-4 max-h-[80vh] overflow-y-auto pr-2'>
                      {renderBookingForm()}
                    </div>
                </DialogContent>
            </Dialog>
        </CardFooter>
    </Card>
)};

export default function PavoBookingsPage() {
  const { bookingSites, siteSettings, loading } = usePavoData();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = siteSettings.heroImages.homes;

  useEffect(() => {
    if (heroImages && heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % heroImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroImages]);

  const homes = bookingSites.filter(s => s.type === 'home');
  const restaurants = bookingSites.filter(s => s.type === 'restaurant');
  const caterers = bookingSites.filter(s => s.type === 'caterer');

  const renderContent = (sites: BookingSite[]) => {
    if (loading) {
      return (
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      )
    }
    if (!sites || sites.length === 0) {
      return (
        <div className="text-center py-20 col-span-full">
          <p className="text-muted-foreground">No listings available in this category yet.</p>
        </div>
      );
    }
    return (
      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map(site => <BookingSiteCard key={site.id} site={site} />)}
      </div>
    );
  };

  return (
    <div className="flex flex-col dark bg-background text-foreground">
      <section className="relative h-[70vh] min-h-[450px] w-full">
        {heroImages && heroImages.length > 0 && heroImages.map((src, index) => (
          <Image
            key={src || index}
            src={typeof src === 'string' && src.trim() ? src : 'https://placehold.co/1920x1080.png?text=Pavo+Homes'}
            alt="A beautiful and aesthetic venue in Tanzania"
            fill
            className={`object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-30' : 'opacity-0'}`}
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
          <Tabs defaultValue="homes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-16">
              <TabsTrigger value="homes" className="h-full text-lg"><Home className="mr-2" /> Homes</TabsTrigger>
              <TabsTrigger value="restaurants" className="h-full text-lg"><UtensilsCrossed className="mr-2" /> Restaurants</TabsTrigger>
              <TabsTrigger value="catering" className="h-full text-lg"><ConciergeBell className="mr-2" /> Catering</TabsTrigger>
            </TabsList>

            <TabsContent value="homes">
                {renderContent(homes)}
            </TabsContent>
            <TabsContent value="restaurants">
                {renderContent(restaurants)}
            </TabsContent>
            <TabsContent value="catering">
                {renderContent(caterers)}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

    