import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Feather } from 'lucide-react';

interface PavoLogoProps {
  className?: string;
}

const PavoLogo = ({ className }: PavoLogoProps) => {
  return (
    <Link href="/" className={cn('flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground group', className)}>
      <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:bg-primary/90 transition-colors">
        <Feather className="h-5 w-5" />
      </div>
      <span className="font-headline">PAVO</span>
    </Link>
  );
};

export default PavoLogo;
