import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import bn from './locales/bn.json';
import gu from './locales/gu.json';
import or from './locales/or.json';
import pa from './locales/pa.json';
import as from './locales/as.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'hi', name: 'हिंदी (Hindi)', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు (Telugu)', dir: 'ltr' },
  { code: 'ta', name: 'தமிழ் (Tamil)', dir: 'ltr' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', dir: 'ltr' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', dir: 'ltr' },
  { code: 'mr', name: 'मराठी (Marathi)', dir: 'ltr' },
  { code: 'bn', name: 'বাংলা (Bengali)', dir: 'ltr' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', dir: 'ltr' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', dir: 'ltr' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', dir: 'ltr' },
  { code: 'as', name: 'অসমীয়া (Assamese)', dir: 'ltr' },
  { code: 'ar', name: 'العربية (Arabic)', dir: 'rtl' }
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    te: { translation: te },
    ta: { translation: ta },
    kn: { translation: kn },
    ml: { translation: ml },
    mr: { translation: mr },
    bn: { translation: bn },
    gu: { translation: gu },
    or: { translation: or },
    pa: { translation: pa },
    as: { translation: as },
    ar: { translation: ar }
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
