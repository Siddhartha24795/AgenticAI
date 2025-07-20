
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Leaf, LineChart, ShieldCheck, Languages, Menu, BellRing } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Header() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', labelKey: 'header.home', icon: Home },
    { path: '/diagnose', labelKey: 'header.diagnose', icon: Leaf },
    { path: '/market', labelKey: 'header.market', icon: LineChart },
    { path: '/schemes', labelKey: 'header.schemes', icon: ShieldCheck },
  ] as const;

  const renderNavLinks = (isMobileLayout = false) => (
    navItems.map((item) => {
      const linkContent = (
        <>
          <item.icon className="h-5 w-5" />
          <span>{t(item.labelKey)}</span>
        </>
      );
  
      if (isMobileLayout) {
        return (
          <DropdownMenuItem key={item.path} asChild>
            <Link 
              href={item.path} 
              className={cn(
                'flex items-center gap-2 w-full',
                pathname === item.path ? 'bg-accent text-accent-foreground' : ''
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {linkContent}
            </Link>
          </DropdownMenuItem>
        );
      }
  
      return (
        <li key={item.path}>
          <Link
            href={item.path}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              pathname === item.path ? 'bg-primary-foreground/20 text-white' : 'text-primary-foreground/80 hover:text-white'
            )}
            aria-current={pathname === item.path ? 'page' : undefined}
          >
            {linkContent}
          </Link>
        </li>
      );
    })
  );
  

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between p-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">
          <Link href="/">{t('header.title')}</Link>
        </h1>
        <div className="flex items-center gap-2">
          {isMobile ? (
            <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-transparent hover:bg-primary-foreground/10 text-white border-white/50 hover:text-white">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('header.openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {renderNavLinks(true)}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <nav>
              <ul className="flex justify-center space-x-1 bg-black/10 p-1 rounded-lg">
                {renderNavLinks(false)}
              </ul>
            </nav>
          )}

          <Link href="/notify" passHref>
             <Button variant="destructive" size="icon" className="relative animate-pulse">
                <BellRing className="h-5 w-5" />
                <span className="sr-only">{t('header.notifier')}</span>
              </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent hover:bg-primary-foreground/10 text-white border-white/50 hover:text-white">
                <Languages className="h-5 w-5" />
                <span className="sr-only">{t('header.changeLanguage')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={language} onValueChange={(val) => setLanguage(val as 'en' | 'kn' | 'hi')}>
                <DropdownMenuRadioItem value="en">{t('header.english')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="kn">{t('header.kannada')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="hi">{t('header.hindi')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
