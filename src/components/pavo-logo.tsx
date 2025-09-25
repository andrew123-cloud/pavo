import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Feather } from 'lucide-react';

interface PavoLogoProps {
  className?: string;
}

const PavoLogo = ({ className }: PavoLogoProps) => {
  return (
    <Link href="/" className={cn('flex items-center gap-3 text-2xl font-black tracking-widest text-foreground group', className)}>
      <span className="font-serif">PAVO</span>
    </Link>
  );
};

export default PavoLogo;
