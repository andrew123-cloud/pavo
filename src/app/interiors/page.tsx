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
    <div className="flex flex-col dark bg-background text-foreground">
      <section className="relative h-[80vh] min-h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=3027&auto=format&fit=crop"
          alt="Elegant living room designed by Pavo Interiors"
          layout="fill"
          objectFit="cover"
          className="opacity-20"
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

      <section id="portfolio" className="bg-secondary/30 py-20 md:py-32">
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
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                  data-ai-hint={item.aiHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
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

      <section id="testimonials" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Words From Our Clients
            </h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-secondary/30 border-0">
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

      <section id="blog-cta" className="bg-secondary/30 py-20 md:py-32">
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
