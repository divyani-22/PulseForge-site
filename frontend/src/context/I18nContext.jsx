import React, { createContext, useContext, useState, useCallback } from 'react';
import { TRANSLATIONS } from '../constants/translations';

const DEFAULT_LANG = 'en';
const SUPPORTED_LANGS = ['en', 'hi', 'mr'];

const fallbackI18n = {
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key, fallback) => (fallback !== undefined ? String(fallback) : String(key || '')),
};

const I18nContext = createContext(fallbackI18n);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  return ctx || fallbackI18n;
};

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_lang') || localStorage.getItem('hmd_lang');
        return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
      }
      return DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  });

  const setLang = useCallback((newLang) => {
    if (SUPPORTED_LANGS.includes(newLang)) {
      setLangState(newLang);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_lang', newLang);
          localStorage.setItem('hmd_lang', newLang);
        }
      } catch {}
    }
  }, []);

  const t = useCallback((key, fallback) => {
    if (!key || typeof key !== 'string') {
      return fallback !== undefined ? String(fallback) : String(key || '');
    }
    const safeLang = (lang && TRANSLATIONS && TRANSLATIONS[lang]) ? lang : DEFAULT_LANG;
    const currentDict = (TRANSLATIONS && TRANSLATIONS[safeLang]) || (TRANSLATIONS && TRANSLATIONS[DEFAULT_LANG]) || {};
    
    if (currentDict && currentDict[key] !== undefined && currentDict[key] !== null) {
      return String(currentDict[key]);
    }
    if (TRANSLATIONS && TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined && TRANSLATIONS.en[key] !== null) {
      return String(TRANSLATIONS.en[key]);
    }
    return fallback !== undefined ? String(fallback) : String(key);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang: lang || DEFAULT_LANG, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};
