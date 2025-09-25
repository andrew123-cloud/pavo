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
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.633 7.855 6.356 9.312-.084-.602-.162-1.602.036-2.203.18-5.522 1.583-6.666 1.583-6.666s-.4-.799-.4-1.968c0-1.848 1.07-3.226 2.408-3.226 1.137 0 1.693.854 1.693 1.876 0 1.14-.725 2.842-1.096 4.428-.299 1.282.64 2.324 1.91 2.324 2.298 0 3.816-2.924 3.816-6.175 0-2.583-1.84-4.59-4.992-4.59-3.414 0-5.418 2.556-5.418 5.15 0 .971.372 2.016.83 2.585.097.121.11.216.082.332-.08.345-.275 1.116-.335 1.348-.07.272-.257.34-.492.204-1.842-1.06-2.99-3.14-2.99-5.41 0-4.225 3.09-7.79 8.58-7.79 4.512 0 8.11 3.21 8.11 7.23 0 4.444-2.82 7.873-6.726 7.873-1.346 0-2.618-.7-3.054-1.527l-.926 3.51c-.265.99-.99 2.19-1.474 2.81.94.276 1.918.428 2.932.428 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);


export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-20">
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
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                aria-label="Pinterest"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <PinterestIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-2">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
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
                <Link href="/bookings" className="text-muted-foreground transition-colors hover:text-primary">
                  Bookings
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
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
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
              Subscribe
            </h3>
            <p className="mt-2 text-muted-foreground">
              Get the latest news, design tips, and special offers.
            </p>
            <form className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                aria-label="Email for newsletter"
                className="bg-background h-12"
              />
              <Button type="submit" size="lg">Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="mt-20 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Pavo Suite. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
