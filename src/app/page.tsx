import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Brush,
  Home,
  MessageSquareQuote,
  PencilRuler,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { portfolioItems, testimonials } from '@/lib/data';

export default function PavoInteriorsHome() {
  return (
    <div className="flex flex-col">
      <section className="relative h-[60vh] min-h-[400px] w-full bg-primary/20">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="Elegant living room designed by Pavo Interiors"
          layout="fill"
          objectFit="cover"
          className="opacity-50"
          data-ai-hint="elegant living room"
        />
        <div className="container mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <div className="relative z-10">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Crafting Spaces, Inspiring Lives
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-foreground/80 md:text-xl">
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
        </div>
      </section>

      <section id="services" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Badge variant="secondary">Our Services</Badge>
            <h2 className="mt-2 font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              What We Offer
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              From concept to completion, we provide a full range of interior
              design services tailored to your needs.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card className="text-center transition-transform hover:scale-105 hover:shadow-xl">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <PencilRuler className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 font-headline">
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
            <Card className="text-center transition-transform hover:scale-105 hover:shadow-xl">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Home className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 font-headline">
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
            <Card className="text-center transition-transform hover:scale-105 hover:shadow-xl">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Brush className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 font-headline">
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

      <section id="portfolio" className="bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Badge variant="secondary">Our Work</Badge>
            <h2 className="mt-2 font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Explore Our Portfolio
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              A glimpse into the beautiful and functional spaces we've created
              for our clients.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioItems.map((item) => (
              <Link
                href="#"
                key={item.id}
                className="group relative block overflow-hidden rounded-lg"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={600}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={item.aiHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="font-headline text-2xl font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="text-white/80">{item.location}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              View Full Portfolio
            </Button>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Badge variant="secondary">Testimonials</Badge>
            <h2 className="mt-2 font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Words From Our Clients
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-primary/5">
                <CardHeader>
                  <MessageSquareQuote className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <Avatar>
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

      <section id="blog-cta" className="bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Get Inspired
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Visit our blog for design tips, trend reports, and inspiration for
              your next project. Or, get personalized recommendations from our AI
              assistant.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg">
                <Link href="#">
                  Read The Blog
                </Link>
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
