// src/app/(public)/interiors/page.tsx
'use client';
import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function PavoInteriorsHome() {
  const { portfolioItems } = usePavoData();
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

  return (
    <div className="flex flex-col dark bg-background text-foreground">
      <section className="relative h-[80vh] min-h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2158&auto=format&fit=crop"
          alt="Elegant living room designed by Pavo Interiors"
          fill
          className="object-cover opacity-30"
          data-ai-hint="elegant living room"
        />
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
            {portfolioItems.map((item) => (
              <Card
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-lg bg-background border-0 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="relative h-80 w-full overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
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
            ))}
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
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Before</h3>
                        <div className="relative h-80 w-full rounded-lg overflow-hidden">
                            <Image src={selectedProject.beforeImageUrl} alt={`Before view of ${selectedProject.title}`} layout="fill" objectFit="cover" data-ai-hint="cluttered room"/>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg mb-2">After</h3>
                        <div className="relative h-80 w-full rounded-lg overflow-hidden">
                            <Image src={selectedProject.imageUrl} alt={`After view of ${selectedProject.title}`} layout="fill" objectFit="cover" data-ai-hint={selectedProject.aiHint}/>
                        </div>
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
                        src={testimonial.avatarUrl}
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

      <section id="blog-cta" className="bg-secondary/50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Get Inspired
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Visit our blog for design tips, trend reports, and inspiration for
              your next project. Or, get personalized recommendations from our AI
              assistant.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg">
                <Link href="#">Read The Blog</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/recommendations">
                  AI Recommendations <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
