
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


export default function PavoSuiteHome() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { siteSettings } = usePavoData();
  const { brandDescriptions, founder, heroImages } = siteSettings;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentFounderImageIndex, setCurrentFounderImageIndex] = useState(0);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  useEffect(() => {
    if (founder?.imageUrls?.length > 1) {
      const interval = setInterval(() => {
        setCurrentFounderImageIndex(prevIndex => (prevIndex + 1) % founder.imageUrls.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [founder]);
  
  const suiteHeroImages = (heroImages?.suite?.length || 0) > 0 ? heroImages.suite : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop'];


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
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-30 transition duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`,
        }}
      />
      <main className="flex-grow">
        <section className="relative h-screen w-full perspective-1000">
          <div className="absolute inset-0 preserve-3d">
            {suiteHeroImages.length > 0 ? (
                suiteHeroImages.map((src, index) => (
                    <div key={src} className="shape" style={{
                        width: '250px',
                        height: '250px',
                        top: `${15 + (index * 20)}%`,
                        left: `${15 + (index * 20)}%`,
                        animationDelay: `-${index*3}s`,
                        backgroundImage: `url(${src})`,
                        backgroundSize: 'cover'
                    }}/>
                ))
            ) : (
                <>
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </>
            )}
          </div>

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
            <PavoLogo className="text-4xl" />
            <h1 className="mt-6 font-serif text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 md:text-7xl">
              Design the Future of Living
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-foreground/70 md:text-xl">
              Pavo is a suite of brands dedicated to inspired living. We craft spaces, curate decor, and create unforgettable memories, guided by a passion for beauty, elegance, and innovation.
            </p>
            <Button asChild size="lg" className="mt-8 group bg-primary/90 hover:bg-primary text-primary-foreground">
              <Link href="#brands">
                Explore The Suite <MoveRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="brands" className="py-20 md:py-32">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                The Pavo Suite
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Three distinct brands, one shared commitment to quality and style.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {pavoBrands.map((brand) => (
                <Card
                  key={brand.name}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-2"
                >
                  <div className="p-8 flex flex-col items-center text-center h-full">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 duration-300">
                      {brand.icon}
                    </div>
                    <CardTitle className="mt-6 font-serif text-3xl text-foreground/90">
                      {brand.name}
                    </CardTitle>
                    <CardContent className="mt-4 flex-grow text-muted-foreground">
                      <p>{brand.description}</p>
                    </CardContent>
                    <div className="mt-6">
                       <Button asChild variant="outline" className="bg-transparent border-white/20 hover:bg-primary/10 hover:text-primary">
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

        <section id="about" className="py-20 md:py-32">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid items-center gap-16 md:grid-cols-2">
              <div className="text-left">
                <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  A Vision of Elegance
                </h2>
                 <div className="mt-6 text-lg text-muted-foreground space-y-4" dangerouslySetInnerHTML={{ __html: (founder?.mainDescription || '').replace(/\n/g, '<br />') }} />
                <Button asChild variant="link" className="text-lg mt-6 p-0 text-primary hover:text-primary/80">
                  <Link href="/about">
                    Learn More About Our Story <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
               <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl perspective-1000">
                <div className="group absolute inset-0 preserve-3d">
                  <div
                    className="absolute inset-0 transition-transform duration-500 ease-in-out backface-hidden group-hover:rotate-y-180 rounded-2xl"
                  >
                     <Image
                      src={founder?.imageUrls?.[currentFounderImageIndex] || '/palvin-portrait.jpg'}
                      alt="Portrait of Palvin Atugonza, founder of Pavo"
                      fill
                      className="object-cover"
                      data-ai-hint="tanzanian entrepreneur portrait"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div
                    className="absolute inset-0 transition-transform duration-500 ease-in-out backface-hidden rotate-y-180 bg-secondary flex items-center justify-center p-8 text-center rounded-2xl"
                  >
                     <div>
                       <Feather className="h-12 w-12 text-primary mx-auto" />
                       <h3 className="mt-4 font-serif text-2xl font-bold">The Pavo Philosophy</h3>
                       <p className="mt-2 text-muted-foreground">{founder?.philosophy || ''}</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
