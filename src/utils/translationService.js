import API_BASE from './api';

export const SUPPORTED_TRANSLATION_LANGUAGES = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
];

export const DEFAULT_TRANSLATE_LANG = 'hi';

export const getPreferredTranslateLang = () => {
  try {
    const saved = localStorage.getItem('campusbridge_preferred_translate_lang');
    if (saved && SUPPORTED_TRANSLATION_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch (e) {}
  return DEFAULT_TRANSLATE_LANG;
};

export const setPreferredTranslateLang = (langCode) => {
  try {
    localStorage.setItem('campusbridge_preferred_translate_lang', langCode);
    window.dispatchEvent(
      new CustomEvent('campusbridge_translate_lang_change', { detail: langCode })
    );
  } catch (e) {}
};

export const getWebsiteLanguage = () => {
  try {
    const saved = localStorage.getItem('campusbridge_site_lang');
    if (saved && (saved === 'en' || SUPPORTED_TRANSLATION_LANGUAGES.some((l) => l.code === saved))) {
      return saved;
    }
  } catch (e) {}
  return 'en';
};

export const setWebsiteLanguage = (langCode) => {
  try {
    const targetCode = langCode || 'en';
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const domainParts = hostname.split('.');
    const rootDomain = domainParts.length > 1 ? '.' + domainParts.slice(-2).join('.') : '';
    const past = 'Thu, 01 Jan 1970 00:00:00 UTC';

    if (targetCode === 'en') {
      // 1. Reset back to native English
      localStorage.removeItem('campusbridge_site_lang');

      // Purge all googtrans cookies across root & domain
      document.cookie = `googtrans=; expires=${past}; path=/;`;
      document.cookie = `googtrans=; expires=${past}; path=/; domain=${hostname};`;
      if (!isLocalhost && rootDomain) {
        document.cookie = `googtrans=; expires=${past}; path=/; domain=${rootDomain};`;
      }

      const selectElem = document.querySelector('.goog-te-combo');
      if (selectElem) {
        selectElem.value = '';
        selectElem.dispatchEvent(new Event('change'));
      }

      window.dispatchEvent(
        new CustomEvent('campusbridge_site_lang_change', { detail: 'en' })
      );

      // Clean full-page refresh so all translated DOM nodes reset to native English
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return;
    }

    // 2. Set target language (e.g. 'bn', 'hi', 'mr', 'ta')
    localStorage.setItem('campusbridge_site_lang', targetCode);
    const cookieVal = `/en/${targetCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (!isLocalhost && rootDomain) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${rootDomain};`;
    }

    // Trigger instant translation without page reload
    const applyToCombo = () => {
      const selectElem = document.querySelector('.goog-te-combo');
      if (selectElem) {
        selectElem.value = targetCode;
        selectElem.dispatchEvent(new Event('change'));
        return true;
      }
      return false;
    };

    if (!applyToCombo()) {
      // If .goog-te-combo is still loading in background, retry until available
      let retries = 0;
      const poll = setInterval(() => {
        retries++;
        if (applyToCombo() || retries > 40) {
          clearInterval(poll);
        }
      }, 80);
    }

    window.dispatchEvent(
      new CustomEvent('campusbridge_site_lang_change', { detail: targetCode })
    );
  } catch (e) {
    console.error('Failed to set website language:', e);
  }
};

export const getLanguageByCode = (code) => {
  return (
    SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === code) || {
      code: code || DEFAULT_TRANSLATE_LANG,
      name: 'Hindi',
      nativeName: 'हिन्दी',
    }
  );
};

// In-memory cache for fast instant toggling
const translationCache = new Map();

/**
 * Translates given text into target language (defaults to preferred user language, which is Hindi by default)
 * @param {string} text - The post caption to translate
 * @param {string} targetLang - Target language code (e.g. 'hi')
 * @returns {Promise<{translatedText: string, detectedSource: string, targetLang: string}>}
 */
export const translateText = async (text, targetLang = getPreferredTranslateLang()) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { translatedText: text || '', detectedSource: 'auto', targetLang };
  }

  const trimmedText = text.trim();
  const cacheKey = `${targetLang}:::${trimmedText}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // 1. Try direct Google Translate client API
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmedText)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data[0])) {
        const translatedText = data[0].map((item) => item[0]).filter(Boolean).join('');
        const detectedSource = data[2] || 'auto';
        const result = {
          translatedText: translatedText || trimmedText,
          detectedSource,
          targetLang,
        };
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.debug('[CampusBridge Translate] Direct request bypassed, falling back to backend proxy:', err);
  }

  // 2. Fallback to backend /api/translate
  try {
    const backendRes = await fetch(
      `${API_BASE}/api/translate?text=${encodeURIComponent(trimmedText)}&target=${encodeURIComponent(targetLang)}`
    );
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data.success && data.translatedText) {
        const result = {
          translatedText: data.translatedText,
          detectedSource: data.detectedSource || 'auto',
          targetLang,
        };
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.error('[CampusBridge Translate] Backend translation error:', err);
  }

  throw new Error('Failed to translate caption. Please check your network connection.');
};
