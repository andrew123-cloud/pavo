import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { Inter, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: {
    default: 'Pavo Suite - Inspired Living',
    template: '%s | Pavo Suite',
  },
  description:
    'The Pavo brand family: Pavo Interiors for bespoke design, Pavo Decors for curated home accessories, and Pavo Homes for aesthetic rentals.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
