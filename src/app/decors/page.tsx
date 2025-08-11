import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { decorProducts } from '@/lib/data';

export default function PavoDecorsHome() {
  const categories = ['Pillows', 'Curtains', 'Vases', 'Wall Art', 'Tableware'];

  return (
    <div className="flex flex-col">
      <section className="bg-primary/10 py-20 md:py-32">
        <div className="container mx-auto grid items-center gap-8 px-4 md:grid-cols-2">
          <div>
            <Badge variant="secondary">Pavo Decors</Badge>
            <h1 className="mt-2 font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Curated Decor for the Modern Home
            </h1>
            <p className="mt-4 max-w-xl text-lg text-foreground/80 md:text-xl">
              Discover unique, handcrafted home accessories that add personality
              and warmth to your space.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="#">
                Shop All Products <ShoppingBag className="ml-2" />
              </Link>
            </Button>
          </div>
          <div className="relative h-80 w-full overflow-hidden rounded-lg shadow-xl md:h-full">
            <Image
              src="https://placehold.co/800x600.png"
              alt="A stylishly arranged collection of home decor items"
              layout="fill"
              objectFit="cover"
              data-ai-hint="home decor collection"
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Shop by Category
            </h2>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button key={category} variant="outline" size="lg" asChild>
                <Link href="#">{category}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Badge>Featured Products</Badge>
            <h2 className="mt-2 font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Our Bestsellers
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Explore pieces loved by our community, perfect for any home.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {decorProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden transition-shadow hover:shadow-xl"
              >
                <CardContent className="p-0">
                  <Link href="#" className="group">
                    <div className="relative h-64 w-full">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.aiHint}
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground">
                        {product.category}
                      </p>
                      <h3 className="mt-1 font-headline font-semibold text-lg text-foreground">
                        {product.name}
                      </h3>
                    </div>
                  </Link>
                </CardContent>
                <CardFooter className="flex justify-between items-center p-4 pt-0">
                  <p className="font-semibold text-lg text-primary">
                    {product.price.toLocaleString()} TZS
                  </p>
                  <Button variant="secondary" size="sm">
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-accent p-8 text-center text-accent-foreground md:p-16">
            <Sparkles className="mx-auto h-12 w-12" />
            <h2 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
              Get Personalized Recommendations
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg">
              Not sure where to start? Let our AI assistant help you find the
              perfect pieces based on your style.
            </p>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="mt-8 bg-accent-foreground text-accent hover:bg-accent-foreground/90"
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
