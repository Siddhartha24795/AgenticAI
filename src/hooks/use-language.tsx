
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'kn' | 'hi';
type LanguageCode = 'en-US' | 'kn-IN' | 'hi-IN';

interface LanguageContextType {
  language: Language;
  languageCode: LanguageCode;
  languagePrompt: string;
  setLanguage: (language: Language) => void;
}

const languageMap: Record<Language, { code: LanguageCode; prompt: string }> = {
    'en': { code: 'en-US', prompt: 'English' },
    'kn': { code: 'kn-IN', prompt: 'Kannada' },
    'hi': { code: 'hi-IN', prompt: 'Hindi' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('kn');

  const value = {
    language,
    languageCode: languageMap[language].code,
    languagePrompt: languageMap[language].prompt,
    setLanguage,
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
