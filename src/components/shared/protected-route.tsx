'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading || (!user && pathname.startsWith('/admin'))) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading...</div>
        </div>
    )
  }

  return <>{children}</>;
}
