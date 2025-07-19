'use client';

import DiagnoseComponent from '@/components/sections/Diagnose';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DiagnosePage() {
    const { user, isAuthReady } = useAuth();
    if (!isAuthReady) {
        return (
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        );
      }
  return <DiagnoseComponent user={user} />;
}
