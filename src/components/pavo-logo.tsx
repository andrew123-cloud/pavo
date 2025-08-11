import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PavoLogoProps {
  className?: string;
}

const PavoLogo = ({ className }: PavoLogoProps) => {
  return (
    <Link href="/" className={cn('font-headline text-2xl font-bold tracking-tight text-foreground', className)}>
      PAVO
    </Link>
  );
};

export default PavoLogo;
