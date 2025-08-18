import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Briefcase,
  Feather,
  GraduationCap,
  Hotel,
  Palette,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PavoSuiteHome() {
  const pavoBrands = [
    {
      name: 'Pavo Interiors',
      description: 'Bespoke design services that transform spaces into personalized works of art.',
      icon: <Palette className="h-10 w-10" />,
      href: '/interiors',
      cta: 'Explore Interiors',
    },
    {
      name: 'Pavo Decors',
      description: 'A curated collection of handcrafted accessories to add warmth and character to your home.',
      icon: <Sparkles className="h-10 w-10" />,
      href: '/decors',
      cta: 'Shop Decors',
    },
    {
      name: 'Pavo Homes',
      description: 'Discover and book unique, aesthetic rental homes for your perfect getaway in Tanzania.',
      icon: <Hotel className="h-10 w-10" />,
      href: '/homes',
      cta: 'Find a Home',
    },
  ];

  return (
    <div className="flex flex-col dark bg-background text-foreground">
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
         <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1542327897-414ecb669423?q=80&w=2828&auto=format&fit=crop"
            alt="An elegant and confident woman, representing the Pavo brand founder."
            fill
            className="object-cover opacity-20 animated-bg-zoom"
            data-ai-hint="elegant confident woman"
          />
           <div className="animated-blob h-[400px] w-[400px] bg-primary/50 top-0 left-1/4 animation-delay-2000"></div>
           <div className="animated-blob h-[500px] w-[500px] bg-secondary/50 bottom-0 right-1/4 animation-delay-4000"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <Feather className="h-16 w-16 text-primary" />
          <h1 className="mt-6 font-headline text-6xl font-bold tracking-tight text-foreground md:text-8xl">
            Welcome to Pavo
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-foreground/80 md:text-xl">
            A family of brands dedicated to inspired living. We craft spaces,
            curate decor, and create unforgettable memories, all guided by a

            passion for beauty and excellence.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="#about">
              Discover Our Story <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="brands" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
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
                className="group transform text-center transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl bg-secondary/50 border-0 flex flex-col"
              >
                <CardHeader className="items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {brand.icon}
                  </div>
                  <CardTitle className="mt-6 font-headline text-3xl">
                    {brand.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{brand.description}</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild variant="outline">
                    <Link href={brand.href}>
                      {brand.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-secondary/50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1599577180430-5a527c699b84?q=80&w=2670&auto=format&fit=crop"
                  alt="Portrait of Palvin Atugonza, founder of Pavo"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  data-ai-hint="tanzanian entrepreneur portrait"
                />
              </div>
            </div>
            <div className="md:col-span-7">
              <Badge variant="secondary" className="mb-4 text-sm">The Visionary</Badge>
              <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Palvin Atugonza
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                The heart and soul behind the Pavo brand is Palvin Atugonza, a
                Tanzanian entrepreneur whose journey is a testament to the
                power of passion, perseverance, and hard work. Her story is
                not just about building a business; it's about creating a
                legacy of beauty and inspiration in her homeland and beyond.
              </p>
              <p className="mt-4 text-lg text-muted-foreground">
                Armed with a degree from the prestigious University of Dar es
                Salaam (UDSM), Palvin stepped into the world not just as a
                graduate, but as a visionary. She possessed an innate understanding of aesthetics and a relentless drive—a combination that would become the cornerstone of her success. She is a natural-born hustler, seeing opportunity where others saw obstacles, and an experienced hardworker, understanding that true achievement is forged in dedication and sweat.
              </p>
              <p className="mt-4 text-lg text-muted-foreground">
                Pavo is the culmination of Palvin's diverse experiences and her unwavering belief in the transformative power of one's environment. Whether it's through the bespoke elegance of Pavo Interiors, the curated charm of Pavo Decors, or the unique hospitality of Pavo Homes, her vision is singular: to inspire a life lived beautifully.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <span className="font-medium">UDSM Graduate</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <span className="font-medium">Serial Entrepreneur</span>
                </div>
                 <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-primary" />
                  <span className="font-medium">Experienced Hardworker</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
