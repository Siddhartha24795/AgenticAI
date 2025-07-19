
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Leaf, LineChart, ShieldCheck, Languages } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/diagnose', label: 'Diagnose', icon: Leaf },
  { path: '/market', label: 'Market', icon: LineChart },
  { path: '/schemes', label: 'Schemes', icon: ShieldCheck },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between p-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">
          <Link href="/">AgriAssist AI</Link>
        </h1>
        <div className="flex items-center gap-2">
          <nav className="w-full sm:w-auto">
            <ul className="flex justify-around sm:justify-center sm:space-x-1 bg-black/10 p-1 rounded-lg">
              {navItems.map((item) => (
                <li key={item.path} className="flex-1 sm:flex-none">
                  <Link
                    href={item.path}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors w-full justify-center sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm',
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent hover:bg-primary-foreground/10 text-white border-white/50 hover:text-white">
                <Languages className="h-5 w-5" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={language} onValueChange={(val) => setLanguage(val as 'en' | 'kn' | 'hi')}>
                <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="kn">ಕನ್ನಡ (Kannada)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="hi">हिन्दी (Hindi)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
