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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { rentalProperties } from '@/lib/data';

export default function PavoHomesHome() {
  const homeTypes = [
    { name: 'Beachfront', icon: <Waves className="h-8 w-8" /> },
    { name: 'Safari Lodges', icon: <TreePine className="h-8 w-8" /> },
    { name: 'City Apartments', icon: <BedDouble className="h-8 w-8" /> },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative h-[70vh] min-h-[500px] w-full">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="A beautiful and aesthetic rental home in Tanzania"
          layout="fill"
          objectFit="cover"
          className="opacity-40"
          data-ai-hint="tanzania landscape"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-end px-4 pb-16 text-center">
          <Badge variant="secondary">Pavo Homes</Badge>
          <h1 className="mt-2 font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Find Your Perfect Stay in Tanzania
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground/80 md:text-xl">
            Discover and book unique, aesthetic homes for your next getaway.
          </p>

          <Card className="mt-8 w-full max-w-4xl p-4 shadow-lg">
            <form className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
              <div className="text-left md:col-span-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Zanzibar, Arusha..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="text-left">
                <label htmlFor="checkin" className="text-sm font-medium">
                  Check in
                </label>
                <Input id="checkin" type="date" className="mt-1" />
              </div>
              <Button size="lg" className="w-full h-10">
                <Search className="mr-2 h-5 w-5" /> Search
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Explore by Home Type
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {homeTypes.map((type) => (
              <Card
                key={type.name}
                className="group transform p-8 text-center transition-all hover:-translate-y-2 hover:bg-primary/10 hover:shadow-xl"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {type.icon}
                </div>
                <h3 className="mt-6 font-headline text-2xl font-semibold">
                  {type.name}
                </h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Featured Properties
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Handpicked homes that offer unforgettable experiences.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rentalProperties.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden transition-shadow hover:shadow-xl"
              >
                <CardContent className="p-0">
                  <Link href="#" className="group">
                    <div className="relative h-64 w-full">
                      <Image
                        src={property.imageUrl}
                        alt={property.title}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={property.aiHint}
                      />
                      <Badge className="absolute right-3 top-3">
                        <Star className="mr-1 h-3 w-3" /> {property.rating}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-headline font-semibold text-xl text-foreground">
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
