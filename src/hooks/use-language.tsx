
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '@/lib/translations';

type Language = 'en' | 'kn' | 'hi';
type LanguageCode = 'en-US' | 'kn-IN' | 'hi-IN';

interface LanguageContextType {
  language: Language;
  languageCode: LanguageCode;
  languagePrompt: string;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const languageMap: Record<Language, { code: LanguageCode; prompt: string }> = {
    'en': { code: 'en-US', prompt: 'English' },
    'kn': { code: 'kn-IN', prompt: 'Kannada' },
    'hi': { code: 'hi-IN', prompt: 'Hindi' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = translations;
    for (const k of keys) {
      result = result?.[k];
    }
    return result?.[language] || key;
  };

  const value = {
    language,
    languageCode: languageMap[language].code,
    languagePrompt: languageMap[language].prompt,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { translations };
