'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import HomeComponent from '@/components/sections/Home';
import DiagnoseComponent from '@/components/sections/Diagnose';
import MarketComponent from '@/components/sections/Market';
import SchemesComponent from '@/components/sections/Schemes';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export type Section = 'home' | 'diagnose' | 'market' | 'schemes';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const { user, isAuthReady } = useAuth();

  const renderContent = () => {
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
    switch (activeSection) {
      case 'home':
        return <HomeComponent setActiveSection={setActiveSection} user={user} />;
      case 'diagnose':
        return <DiagnoseComponent user={user} />;
      case 'market':
        return <MarketComponent />;
      case 'schemes':
        return <SchemesComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
