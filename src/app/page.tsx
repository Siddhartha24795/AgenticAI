'use client';

import Header from '@/components/layout/Header';
import HomeComponent from '@/components/sections/Home';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <HomeComponent />
      </main>
    </div>
  );
}
