'use client';

import type { Section } from '@/app/page';
import { cn } from '@/lib/utils';
import { Home, Leaf, LineChart, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'diagnose', label: 'Diagnose', icon: Leaf },
  { id: 'market', label: 'Market', icon: LineChart },
  { id: 'schemes', label: 'Schemes', icon: ShieldCheck },
] as const;

export default function Header({ activeSection, setActiveSection }: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-40">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">
          AgriAssist AI
        </h1>
        <nav className="w-full sm:w-auto">
          <ul className="flex justify-around sm:justify-center sm:space-x-1 bg-black/10 p-1 rounded-lg">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full justify-center',
                    'hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    activeSection === item.id ? 'bg-primary-foreground/20 text-white' : 'text-primary-foreground/80 hover:text-white'
                  )}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
