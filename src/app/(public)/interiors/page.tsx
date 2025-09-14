
// src/app/(public)/interiors/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Brush,
  MessageSquareQuote,
  PencilRuler,
  Home,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { testimonials } from '@/lib/data';
import { usePavoData } from '@/context/data-context';
import type { PortfolioItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { BookingForm } from '@/components/shared/booking-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export default function PavoInteriorsHome() {
  const { portfolioItems, siteSettings, loading } = usePavoData();
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = siteSettings.heroImages.interiors;

  useEffect(() => {
    if (heroImages && heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % heroImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroImages]);


  return (
    <div className="flex flex-col dark bg-background text-foreground">
      <section className="relative h-[80vh] min-h-[500px] w-full">
        {heroImages && heroImages.length > 0 && heroImages.map((src, index) => (
            <Image
                key={src || index}
                src={typeof src === 'string' && src.trim() ? src : 'https://placehold.co/1920x1080.png?text=Pavo+Interiors'}
                alt="Elegant living room designed by Pavo Interiors"
                fill
                className={`object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-30' : 'opacity-0'}`}
                data-ai-hint="elegant living room"
                priority={index === 0}
            />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Pavo Interiors
          </Badge>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Crafting Spaces, Inspiring Lives
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-foreground/80 md:text-xl">
            At Pavo Interiors, we believe that a well-designed space can
            transform your life. We specialize in creating bespoke interiors
            that reflect your personality and style.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="#contact">
              Start Your Design Journey <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="services" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              What We Offer
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              From concept to completion, we provide a full range of interior
              design services tailored to your needs.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card className="text-center bg-transparent border-0 shadow-none">
              <CardHeader>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-foreground">
                  <PencilRuler className="h-10 w-10" />
                </div>
                <CardTitle className="mt-6 font-headline text-2xl">
                  Interior Design Consultation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our experts help you define your vision and create a cohesive
                  plan for your space.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center bg-transparent border-0 shadow-none">
              <CardHeader>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Home className="h-10 w-10" />
                </div>
                <CardTitle className="mt-6 font-headline text-2xl">
                  Full Home Styling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A complete design overhaul, we manage everything from furniture
                  selection to final installation.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center bg-transparent border-0 shadow-none">
              <CardHeader>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Brush className="h-10 w-10" />
                </div>
                <CardTitle className="mt-6 font-headline text-2xl">
                  E-Decor & Virtual Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get professional design guidance and a custom plan you can
                  implement on your own, all online.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="portfolio" className="bg-secondary/50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Explore Our Portfolio
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              A glimpse into the beautiful and functional spaces we've created
              for our clients.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
             {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="flex flex-col bg-background border-0 shadow-lg">
                        <Skeleton className="h-80 w-full" />
                        <CardFooter className="p-4 mt-auto">
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                ))
            ) : portfolioItems && portfolioItems.length > 0 ? (
                portfolioItems.map((item) => (
                <Card
                    key={item.id}
                    className="group relative flex flex-col overflow-hidden rounded-lg bg-background border-0 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                >
                    <div className="relative h-80 w-full overflow-hidden">
                    <img
                        src={item.imageUrls?.[0] && typeof item.imageUrls?.[0] === 'string' && item.imageUrls[0].trim() ? item.imageUrls[0] : 'https://placehold.co/400x320.png?text=No+Image'}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                        data-ai-hint={item.aiHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6">
                        <h3 className="font-headline text-2xl font-bold text-white">
                        {item.title}
                        </h3>
                        <p className="text-white/80">{item.location}</p>
                    </div>
                    </div>
                    <CardFooter className="p-4 mt-auto bg-background">
                        <Button variant="outline" className="w-full" onClick={() => setSelectedProject(item)}>
                            View Project
                        </Button>
                    </CardFooter>
                </Card>
                ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No portfolio items have been added yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle className="font-headline text-3xl">{selectedProject.title}</DialogTitle>
                    <DialogDescription>{selectedProject.location}</DialogDescription>
                 </DialogHeader>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {(selectedProject.beforeImageUrls?.length || 0) > 0 && (
                      <div>
                          <h3 className="font-semibold text-lg mb-2">Before</h3>
                          <Carousel className="w-full rounded-lg overflow-hidden">
                              <CarouselContent>
                                  {selectedProject.beforeImageUrls!.map((url, i) => (
                                      <CarouselItem key={i}>
                                          <div className="relative h-80 w-full">
                                              <img src={typeof url === 'string' && url.trim() ? url : 'https://placehold.co/400x320/png?text=No+Image'} alt={`Before view ${i+1} of ${selectedProject.title}`} className="absolute inset-0 w-full h-full object-cover" data-ai-hint="cluttered room"/>
                                          </div>
                                      </CarouselItem>
                                  ))}
                              </CarouselContent>
                               {selectedProject.beforeImageUrls!.length > 1 && <>
                                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                              </>}
                          </Carousel>
                      </div>
                    )}
                     <div className={!(selectedProject.beforeImageUrls?.length) ? 'md:col-span-2' : ''}>
                        <h3 className="font-semibold text-lg mb-2">After</h3>
                          <Carousel className="w-full rounded-lg overflow-hidden">
                              <CarouselContent>
                                  {selectedProject.imageUrls.map((url, i) => (
                                      <CarouselItem key={i}>
                                          <div className="relative h-80 w-full">
                                              <img src={typeof url === 'string' && url.trim() ? url : 'https://placehold.co/400x320/png?text=No+Image'} alt={`After view ${i+1} of ${selectedProject.title}`} className="absolute inset-0 w-full h-full object-cover" data-ai-hint={selectedProject.aiHint}/>
                                          </div>
                                      </CarouselItem>
                                  ))}
                              </CarouselContent>
                               {selectedProject.imageUrls.length > 1 && <>
                                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                              </>}
                          </Carousel>
                    </div>
                 </div>
                <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2">About The Project</h3>
                    <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>
            </DialogContent>
        </Dialog>
      )}


      <section id="testimonials" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Words From Our Clients
            </h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-secondary/50 border-0">
                <CardHeader>
                  <MessageSquareQuote className="h-10 w-10 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg">
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={typeof testimonial.avatarUrl === 'string' && testimonial.avatarUrl.trim() ? testimonial.avatarUrl : 'https://placehold.co/48x48.png'}
                        alt={testimonial.name}
                      />
                      <AvatarFallback>
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.projectType}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
           <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Start Your Design Journey
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Ready to transform your space? Fill out the form below to book a consultation with our design experts.
            </p>
          </div>
          <div className="mt-12 max-w-2xl mx-auto">
            <BookingForm />
          </div>
        </div>
      </section>
    </div>
  );
}
