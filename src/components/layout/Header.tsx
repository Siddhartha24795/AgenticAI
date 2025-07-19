
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Leaf, LineChart, ShieldCheck } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/diagnose', label: 'Diagnose', icon: Leaf },
  { path: '/market', label: 'Market', icon: LineChart },
  { path: '/schemes', label: 'Schemes', icon: ShieldCheck },
] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-40">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">
          <Link href="/">AgriAssist AI</Link>
        </h1>
        <nav className="w-full sm:w-auto">
          <ul className="flex justify-around sm:justify-center sm:space-x-1 bg-black/10 p-1 rounded-lg">
            {navItems.map((item) => (
              <li key={item.path} className="flex-1 sm:flex-none">
                <Link
                  href={item.path}
                  className={cn(
                    'flex flex-col md:flex-row items-center gap-1 md:gap-2 rounded-md px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm font-medium transition-colors w-full justify-center',
                    'hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    pathname === item.path ? 'bg-primary-foreground/20 text-white' : 'text-primary-foreground/80 hover:text-white'
                  )}
                  aria-current={pathname === item.path ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
