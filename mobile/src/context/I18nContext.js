import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [lang, setLangState] = useState(DEFAULT_LANG);

  useEffect(() => {
    (async () => {
      try {
        let saved = await AsyncStorage.getItem('user_lang');
        if (!saved) saved = await AsyncStorage.getItem('hmd_lang');
        if (!saved && typeof localStorage !== 'undefined') {
          saved = localStorage.getItem('user_lang') || localStorage.getItem('hmd_lang');
        }
        if (saved && SUPPORTED_LANGS.includes(saved)) {
          setLangState(saved);
        }
      } catch {}
    })();
  }, []);

  const setLang = useCallback((newLang) => {
    if (SUPPORTED_LANGS.includes(newLang)) {
      setLangState(newLang);
      AsyncStorage.setItem('user_lang', newLang).catch(() => {});
      AsyncStorage.setItem('hmd_lang', newLang).catch(() => {});
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('user_lang', newLang);
          localStorage.setItem('hmd_lang', newLang);
        } catch {}
      }
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
    // Fallback to English if missing in target lang
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
