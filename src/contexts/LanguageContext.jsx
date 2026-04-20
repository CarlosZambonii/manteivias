import React, { createContext, useState, useContext, useCallback } from 'react';
import { translations } from '@/i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Default to 'pt' if nothing stored
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('manteivias_language');
    return stored || 'pt';
  });

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('manteivias_language', lang);
    }
  };

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value === undefined || value === null) break;
      value = value[k];
    }
    
    if (value === undefined) {
      // Fallback to PT if key missing in current lang
      let fallbackValue = translations['pt'];
      for (const k of keys) {
        if (fallbackValue === undefined || fallbackValue === null) break;
        fallbackValue = fallbackValue[k];
      }
      return fallbackValue || key; 
    }
    
    return value;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};