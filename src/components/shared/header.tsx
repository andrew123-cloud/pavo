'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import PavoLogo from '../pavo-logo';
import { usePavoData } from '@/context/data-context';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/interiors', label: 'Interiors' },
  { href: '/decors', label: 'Decors' },
  { href: '/homes', label: 'Homes' },
  { href: '/recommendations', label: 'AI Helper' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount } = usePavoData();

  const getActiveSite = (path: string) => {
    if (path.startsWith('/interiors')) return '/interiors';
    if (path.startsWith('/decors')) return '/decors';
    if (path.startsWith('/homes')) return '/homes';
    if (path.startsWith('/recommendations')) return '/recommendations';
    if (path.startsWith('/cart')) return '/cart';
    if (path === '/') return '/';
    return '';
  };

  const activeSite = getActiveSite(pathname);

  const NavLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className={cn(
        'relative text-lg font-medium transition-colors hover:text-primary',
        activeSite === href ? 'text-primary' : 'text-foreground/70',
        'after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300',
        activeSite === href ? 'after:w-full' : 'hover:after:w-full'
      )}
      onClick={() => setIsMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <PavoLogo />
        <nav className="hidden items-center space-x-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Link>
          </Button>
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container mx-auto flex flex-col space-y-4 px-4 pb-4">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
