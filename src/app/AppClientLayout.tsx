'use client';

import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthReady } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        {!isAuthReady ? (
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
