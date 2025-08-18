import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react';
import PavoLogo from '@/components/pavo-logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.51,2.05A10,10,0,0,0,2.05,12.51c0,4.24,2.63,7.85,6.36,9.31.05-.33.11-.75.11-1.07,0-.31.08-.62.27-.92,0,0,0.49-2.07.5-2.1,0.1-0.21.31-0.42.31-0.83,0-0.78-0.46-1.35-1-1.35-0.61,0-.81,0.41-0.81,1,0,0.38,0.16,0.95.42,1.26,0.06,0.07.06,0.14,0.05,0.21-0.08.35-.28,1.13-.34,1.37s-0.18.3-0.4.24c-1.31-.35-2.16-1.78-2.16-3.23,0-2.31,1.74-4.63,5-4.63,2.7,0,4.2,1.83,4.2,4.06,0,2.37-1.2,4.4-2.88,4.4-0.81,0-1.58-.62-1.35-1.38.25-0.81.74-1.68.74-2.26,0-0.57-.28-1.06-.83-1.06-0.43,0-.77.44-.77,0.9,0,0.41.13.72,0.13,0.72s-0.5,2.12-0.6,2.5c-0.25.99-1.42,2.15-2.09,2.78,0.75,0.22,1.52,0.34,2.32,0.34,5.29,0,9.59-4.3,9.59-9.59A9.59,9.59,0,0,0,12.51,2.05Z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-secondary/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <PavoLogo />
            <p className="mt-4 text-muted-foreground">
              A family of brands for inspired living. Crafting spaces, curating
              decor, and creating memories.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link
                href="#"
                aria-label="Facebook"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Facebook className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Instagram className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                aria-label="Pinterest"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <PinterestIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-2">
            <h3 className="font-headline font-semibold text-foreground text-lg">
              Sites
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/interiors" className="text-muted-foreground transition-colors hover:text-primary">
                  Interiors
                </Link>
              </li>
              <li>
                <Link href="/decors" className="text-muted-foreground transition-colors hover:text-primary">
                  Decors
                </Link>
              </li>
              <li>
                <Link href="/homes" className="text-muted-foreground transition-colors hover:text-primary">
                  Homes
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h3 className="font-headline font-semibold text-foreground text-lg">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Contact
                </Link>
              </li>
               <li>
                <Link href="/admin/login" className="text-muted-foreground transition-colors hover:text-primary">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-4">
            <h3 className="font-headline font-semibold text-foreground text-lg">
              Subscribe to our newsletter
            </h3>
            <p className="mt-2 text-muted-foreground">
              Get the latest news, design tips, and special offers.
            </p>
            <form className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                aria-label="Email for newsletter"
                className="bg-background/50 h-12"
              />
              <Button type="submit" size="lg">Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="mt-16 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Pavo Suite. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
