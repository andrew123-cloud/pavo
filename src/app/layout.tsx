import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Alegreya } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { DataProvider } from '@/context/data-context';

const fontSans = Alegreya({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Alegreya({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700', '900'],
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
