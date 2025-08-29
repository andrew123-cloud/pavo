
// src/app/(public)/homes/page.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  MapPin,
  Search,
  Star,
  TreePine,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePavoData } from '@/context/data-context';
import { useState, useEffect } from 'react';

export default function PavoHomesHome() {
  const { rentalProperties, siteSettings } = usePavoData();
  const homeTypes = [
    { name: 'Beachfront', icon: <Waves className="h-10 w-10" /> },
    { name: 'Safari Lodges', icon: <TreePine className="h-10 w-10" /> },
    { name: 'City Apartments', icon: <BedDouble className="h-10 w-10" /> },
  ];
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
      <section className="relative h-[80vh] min-h-[500px] w-full">
        {heroImages.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt="A beautiful and aesthetic rental home in Tanzania"
            layout="fill"
            objectFit="cover"
            className={`transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-30' : 'opacity-0'}`}
            data-ai-hint="tanzania rental home"
            priority={index === 0}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 pb-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Pavo Homes
          </Badge>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Find Your Perfect Stay in Tanzania
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground/80 md:text-xl">
            Discover and book unique, aesthetic homes for your next getaway.
          </p>

          <Card className="mt-8 w-full max-w-4xl p-4 shadow-lg bg-background/80 backdrop-blur-sm border-0">
            <form className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
              <div className="text-left md:col-span-2">
                <label htmlFor="location" className="text-sm font-medium ml-3">
                  Location
                </label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Zanzibar, Arusha..."
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <div className="text-left">
                <label htmlFor="checkin" className="text-sm font-medium ml-3">
                  Check in
                </label>
                <Input id="checkin" type="date" className="mt-1 h-12" />
              </div>
              <Button size="lg" className="w-full h-12">
                <Search className="mr-2 h-5 w-5" /> Search
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Explore by Home Type
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {homeTypes.map((type) => (
              <Card
                key={type.name}
                className="group transform p-8 text-center transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl bg-secondary/50 border-0"
              >
                <CardHeader>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {type.icon}
                  </div>
                  <CardTitle className="mt-6 font-headline text-3xl">
                    {type.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="bg-secondary/50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Featured Properties
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Handpicked homes that offer unforgettable experiences.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rentalProperties.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 bg-background border-0"
              >
                <CardContent className="p-0">
                  <Link href="#" className="group">
                    <div className="relative h-80 w-full overflow-hidden rounded-lg">
                      <Image
                        src={property.imageUrl}
                        alt={property.title}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-500 ease-in-out group-hover:scale-105"
                        data-ai-hint={property.aiHint}
                      />
                      <Badge className="absolute right-3 top-3 bg-primary/80 text-primary-foreground backdrop-blur-sm">
                        <Star className="mr-1 h-3 w-3" /> {property.rating}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-headline font-semibold text-2xl text-foreground">
                        {property.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {property.location}
                      </p>
                      <p className="mt-4 font-semibold text-lg text-primary">
                        {property.pricePerNight.toLocaleString()} TZS{' '}
                        <span className="text-sm font-normal text-muted-foreground">
                          / night
                        </span>
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="#">
                View All Properties <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
