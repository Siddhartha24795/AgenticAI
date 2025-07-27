
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import { LanguageProvider, useLanguage, translations } from '@/hooks/use-language';
import { useEffect } from 'react';
import { Space_Grotesk, Inter } from 'next/font/google'
 
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})
 
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = translations.layout.title[language];
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', translations.layout.description[language]);
    }
  }, [language]);

  return (
    <html lang={language} suppressHydrationWarning>
      <head>
         <meta name="description" content={translations.layout.description[language]} />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-body bg-background text-foreground antialiased`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <AppLayout>{children}</AppLayout>
    </LanguageProvider>
  );
}

    