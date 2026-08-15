import React, { createContext, useEffect, useState } from 'react';
import i18n, { SUPPORTED_LANGUAGES } from '../i18n';

export const LanguageScopeContext = createContext({
  currentLang: 'en',
  changeLanguage: () => {},
  scope: 'customer'
});

const applyLanguageState = (langCode) => {
  i18n.changeLanguage(langCode);
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  const dir = langConfig ? langConfig.dir : 'ltr';
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir;
    document.documentElement.lang = langCode;
  }
};

export function CustomerLanguageScope({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('customer_app_language') || 'en';
  });

  useEffect(() => {
    applyLanguageState(currentLang);
  }, [currentLang]);

  const changeLanguage = (newLang) => {
    localStorage.setItem('customer_app_language', newLang);
    setCurrentLang(newLang);
    applyLanguageState(newLang);
  };

  return (
    <LanguageScopeContext.Provider value={{ currentLang, changeLanguage, scope: 'customer' }}>
      {children}
    </LanguageScopeContext.Provider>
  );
}

export function AdminLanguageScope({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('admin_app_language') || 'en';
  });

  useEffect(() => {
    applyLanguageState(currentLang);
  }, [currentLang]);

  const changeLanguage = (newLang) => {
    localStorage.setItem('admin_app_language', newLang);
    setCurrentLang(newLang);
    applyLanguageState(newLang);
  };

  return (
    <LanguageScopeContext.Provider value={{ currentLang, changeLanguage, scope: 'admin' }}>
      {children}
    </LanguageScopeContext.Provider>
  );
}
