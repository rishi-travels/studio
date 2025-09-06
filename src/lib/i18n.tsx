"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import bn from '@/locales/bn.json';
import te from '@/locales/te.json';
import mr from '@/locales/mr.json';
import ta from '@/locales/ta.json';
import ur from '@/locales/ur.json';
import gu from '@/locales/gu.json';
import kn from '@/locales/kn.json';
import or from '@/locales/or.json';
import ml from '@/locales/ml.json';
import pa from '@/locales/pa.json';
import bho from '@/locales/bho.json';


type Translations = typeof en;
type LanguageCode = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'ur' | 'gu' | 'kn' | 'or' | 'ml' | 'pa' | 'bho';

const translations: Record<LanguageCode, Translations> = { en, hi, bn, te, mr, ta, ur, gu, kn, or, ml, pa, bho };

export const languages: { code: LanguageCode; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'bho', name: 'भोजपुरी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'mr', name: 'मराठी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'ur', name: 'اردو' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
];

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: keyof Translations) => string;
  languages: { code: LanguageCode; name: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as LanguageCode | null;
    if (savedLanguage && languages.some(l => l.code === savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = (key: keyof Translations): string => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
