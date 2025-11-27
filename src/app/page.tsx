// src/app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Feather, Hotel, Palette, Sparkles, MoveRight, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import PavoLogo from '@/components/pavo-logo';
import { usePavoData } from '@/context/data-context';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';


export default function PavoSuiteHome() {
  const { siteSettings, loading } = usePavoData();
  const { brandDescriptions, founder, heroImages } = siteSettings;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentFounderImageIndex, setCurrentFounderImageIndex] = useState(0);

  const suiteHeroImages = (heroImages?.suite?.length || 0) > 0 ? heroImages.suite : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1920&h=1080&auto=format&fit=crop'];
  const founderImages = (founder?.imageUrls?.length || 0) > 0 ? founder.imageUrls : ['/palvin-portrait.jpg'];

  useEffect(() => {
    if (suiteHeroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % suiteHeroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [suiteHeroImages.length]);

  useEffect(() => {
    if (founderImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentFounderImageIndex(prevIndex => (prevIndex + 1) % founderImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [founderImages.length]);


  const pavoBrands = [
    {
      name: 'Pavo Interiors',
      description: brandDescriptions?.interiors || '',
      icon: <Palette className="h-8 w-8" />,
      href: '/interiors',
      cta: 'Explore Interiors',
    },
    {
      name: 'Pavo Decors',
      description: brandDescriptions?.decors || '',
      icon: <Sparkles className="h-8 w-8" />,
      href: '/decors',
      cta: 'Shop Decors',
    },
    {
      name: 'Pavo Bookings',
      description: brandDescriptions?.homes || '',
      icon: <CalendarCheck className="h-8 w-8" />,
      href: '/bookings',
      cta: 'Make a Booking',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
       <Header />
      <main className="flex-grow">
        <section className="relative h-screen w-full flex items-center justify-center">
            {suiteHeroImages.map((src, index) => (
                <Image
                    key={src || index}
                    src={typeof src === 'string' && src.trim() ? src : 'https://placehold.co/1920x1080.png?text=Pavo+Suite'}
                    alt="Elegant Pavo branding background"
                    fill
                    className={cn(
                      'object-cover transition-opacity duration-1000 ease-in-out',
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    )}
                    priority={index === 0}
                    data-ai-hint="elegant interior design"
                />
            ))}
            <div className="absolute inset-0 bg-background/50" />

          <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center text-foreground">
            <h1 className="font-serif text-5xl font-black tracking-tighter text-white md:text-8xl">
              Design the Future of Living
            </h1>
            <p className="mt-6 max-w-3xl text-2xl text-white md:text-3xl">
              Pavo is a suite of brands dedicated to inspired living. We craft spaces, curate decor, and create unforgettable memories, guided by a passion for beauty, elegance, and innovation.
            </p>
            <Button asChild size="lg" className="mt-8 group" variant="outline">
              <Link href="#brands">
                Explore The Suite <MoveRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="brands" className="py-24 md:py-40 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                The Pavo Suite
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three distinct brands, one shared commitment to quality and style.
              </p>
            </div>
            <div className="mt-20 grid gap-8 md:grid-cols-3">
              {pavoBrands.map((brand) => (
                <Card
                  key={brand.name}
                  className="group relative overflow-hidden rounded-none border border-border/20 bg-transparent shadow-none transition-all duration-300"
                >
                  <div className="p-8 flex flex-col items-start text-left h-full">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-transparent border border-border text-primary transition-colors duration-300">
                      {brand.icon}
                    </div>
                    <CardTitle className="mt-6 font-serif text-3xl text-foreground">
                      {brand.name}
                    </CardTitle>
                    <CardContent className="mt-4 flex-grow p-0 text-muted-foreground">
                      <p className="text-xl">{brand.description}</p>
                    </CardContent>
                    <div className="mt-8">
                       <Button asChild variant="link" className="p-0 text-primary">
                        <Link href={brand.href}>
                          {brand.cta} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-24 md:py-40 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-16 md:grid-cols-2">
              <div className="text-left">
                 <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  A Vision of Elegance
                </h2>
                 <div className="mt-6 text-lg text-muted-foreground space-y-4" dangerouslySetInnerHTML={{ __html: (founder?.mainDescription || '').replace(/\n/g, '<br />') }} />
                <p className='mt-6 text-lg text-muted-foreground font-semibold italic border-l-2 border-primary pl-4'>
                  {founder?.philosophy || ''}
                </p>
              </div>
               <div className="relative h-[600px] w-full group">
                {founderImages.map((src, index) => (
                  <Image
                    key={src || index}
                    src={typeof src === 'string' && src.trim() ? src : '/palvin-portrait.jpg'}
                    alt="Portrait of Palvin Atugonza, founder of Pavo"
                    fill
                    className={cn(
                      'object-cover transition-opacity duration-1000 ease-in-out',
                      index === currentFounderImageIndex ? 'opacity-100' : 'opacity-0'
                    )}
                    data-ai-hint="tanzanian entrepreneur portrait"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
