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

export default function PavoDecorsHome() {
  const { decorProducts, addToCart } = usePavoData();
  const { toast } = useToast();
  const categories = ['Pillows', 'Curtains', 'Vases', 'Wall Art', 'Tableware'];

  const handleAddToCart = (product: (typeof decorProducts)[0]) => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  }

  return (
    <div className="flex flex-col dark bg-background text-foreground">
      <section className="relative h-[80vh] min-h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=2832&auto=format&fit=crop"
          alt="A stylishly arranged collection of home decor items"
          layout="fill"
          objectFit="cover"
          className="opacity-30"
          data-ai-hint="home decor collection"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-start justify-center px-4 text-left">
          <Badge variant="secondary" className="mb-4">
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

      <section id="featured" className="bg-secondary/50 py-20 md:py-32">
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
            {decorProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 bg-transparent border-0 flex flex-col"
              >
                <CardContent className="p-0 flex-grow">
                  <div className="group">
                    <div className="relative h-96 w-full overflow-hidden rounded-lg">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-500 ease-in-out group-hover:scale-105"
                        data-ai-hint={product.aiHint}
                      />
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
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-primary/10 p-8 text-center md:p-16">
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
