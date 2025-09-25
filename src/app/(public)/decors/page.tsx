// src/app/(public)/decors/page.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePavoData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export default function PavoDecorsHome() {
  const { decorProducts, addToCart, siteSettings, loading } = usePavoData();
  const { toast } = useToast();
  const categories = ['Pillows', 'Curtains', 'Vases', 'Wall Art', 'Tableware'];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = siteSettings.heroImages.decors;

  useEffect(() => {
    if (heroImages && heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % heroImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroImages]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  }

  return (
    <div className="flex flex-col bg-background text-foreground">
      <section className="relative h-[80vh] min-h-[500px] w-full">
        {heroImages && heroImages.length > 0 && heroImages.map((src, index) => (
          <Image
            key={src || index}
            src={typeof src === 'string' && src.trim() ? src : 'https://placehold.co/1920x1080.png?text=Pavo+Decors'}
            alt="A stylishly arranged collection of home decor items"
            fill
            className={`object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            data-ai-hint="home decor collection"
            priority={index === 0}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-start justify-center px-4 text-left">
          <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur">
            Pavo Decors
          </Badge>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-7xl max-w-2xl">
            Curated Decor for the Modern Home
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/80 md:text-xl">
            Discover unique, handcrafted home accessories that add personality
            and warmth to your space.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="#featured">
              Shop All Products <ShoppingBag className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Shop by Category
            </h2>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button key={category} variant="outline" size="lg" asChild className="rounded-full px-8 py-6 text-lg">
                <Link href="#">{category}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="bg-secondary/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Our Bestsellers
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Explore pieces loved by our community, perfect for any home.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="bg-transparent border-0 flex flex-col">
                        <Skeleton className="h-96 w-full rounded-lg" />
                        <div className="p-4 text-center">
                            <Skeleton className="h-6 w-3/4 mx-auto" />
                            <Skeleton className="h-5 w-1/2 mx-auto mt-2" />
                        </div>
                        <CardFooter className="flex justify-center p-4 pt-0">
                            <Skeleton className="h-12 w-full" />
                        </CardFooter>
                    </Card>
                ))
            ) : decorProducts && decorProducts.length > 0 ? (
                decorProducts.map((product) => (
                <Card
                    key={product.id}
                    className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 bg-transparent border-0 flex flex-col"
                >
                    <CardContent className="p-0 flex-grow">
                        <div className="group relative">
                            <div className="relative h-96 w-full overflow-hidden rounded-lg">
                                {(product.image_urls?.length || 0) > 0 ? (
                                <Carousel className="w-full h-full">
                                    <CarouselContent>
                                        {product.image_urls.map((url, index) => (
                                            <CarouselItem key={index}>
                                                <div className="relative h-96 w-full">
                                                    <img
                                                        src={typeof url === 'string' && url.trim() ? url : 'https://placehold.co/400x400.png?text=Image+Not+Available'}
                                                        alt={`${product.name} image ${index + 1}`}
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                                        data-ai-hint={product.aiHint}
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {product.image_urls.length > 1 && (
                                        <>
                                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </>
                                    )}
                                </Carousel>
                                ) : (
                                <img
                                    src={'https://placehold.co/400x400.png?text=Image+Not+Available'}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    data-ai-hint={product.aiHint}
                                />
                                )}
                                {product.stock > 0 ? (
                                    <Badge className="absolute left-3 top-3 bg-primary/80 text-primary-foreground backdrop-blur-sm">In Stock</Badge>
                                ): (
                                    <Badge variant="destructive" className="absolute left-3 top-3">Out of Stock</Badge>
                                )}
                            </div>
                            <div className="p-4 text-center">
                                <h3 className="mt-2 font-headline font-semibold text-xl text-foreground">
                                    {product.name}
                                </h3>
                                <p className="text-lg text-muted-foreground">
                                    {product.price.toLocaleString()} TZS
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center p-4 pt-0">
                        <Button variant="secondary" size="lg" className="w-full" disabled={product.stock === 0} onClick={() => handleAddToCart(product)}>
                            Add to Cart
                        </Button>
                    </CardFooter>
                </Card>
                ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No products have been added yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-secondary/30 border border-border p-8 text-center md:p-16">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 font-headline text-4xl font-bold md:text-5xl">
              Get Personalized Recommendations
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
              Not sure where to start? Let our AI assistant help you find the
              perfect pieces based on your style.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8"
            >
              <Link href="/recommendations">
                Find Your Style <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
