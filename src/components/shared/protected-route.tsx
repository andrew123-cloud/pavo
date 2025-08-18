'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait for loading to complete
    }

    if (!user && pathname !== '/admin/login') {
      router.push('/admin/login');
    }

    if (user && pathname === '/admin/login') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading Admin...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on the login page, render nothing while redirecting
  if (!user && pathname !== '/admin/login') {
    return null;
  }

  // If authenticated and on the login page, render nothing while redirecting
  if (user && pathname === '/admin/login') {
    return null;
  }

  // Otherwise, show the children
  return <>{children}</>;
}
