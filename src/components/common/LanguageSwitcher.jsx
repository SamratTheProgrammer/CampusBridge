import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  SUPPORTED_TRANSLATION_LANGUAGES,
  getWebsiteLanguage,
  setWebsiteLanguage,
  getLanguageByCode,
} from '../../utils/translationService';
import toast from 'react-hot-toast';

const QUICK_LANGS = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

/**
 * LanguageSwitcher Component
 * Global floating or top-bar language selector that instantly switches
 * the entire website language in real-time.
 */
const LanguageSwitcher = ({ className = '', dropUp = false }) => {
  const [currentLang, setCurrentLang] = useState(getWebsiteLanguage);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onLangChange = (e) => {
      if (e.detail) {
        setCurrentLang(e.detail);
      }
    };
    window.addEventListener('campusbridge_site_lang_change', onLangChange);
    return () => {
      window.removeEventListener('campusbridge_site_lang_change', onLangChange);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelectLanguage = (code) => {
    if (code === currentLang) {
      setIsOpen(false);
      return;
    }
    setWebsiteLanguage(code);
    setCurrentLang(code);
    setIsOpen(false);

    const langObj = getLanguageByCode(code);
    if (code === 'en') {
      toast.success('Website restored to English (Original)', { icon: '🌐' });
    } else {
      toast.success(`Translating website to ${langObj.nativeName} (${langObj.name})...`, { icon: '✨' });
    }
  };

  const activeLangObj = getLanguageByCode(currentLang);

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card border border-border/60 hover:bg-muted text-foreground text-xs font-semibold shadow-2xs hover:border-primary/40 transition-all cursor-pointer group"
        title={`Change website language (Current: ${activeLangObj.name})`}
        aria-label="Change website language"
      >
        <Globe className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
        <span className="max-w-[80px] sm:max-w-[100px] truncate">
          {currentLang === 'en' ? 'EN' : activeLangObj.nativeName}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-[120] p-3 bg-card border border-border rounded-2xl shadow-2xl w-64 max-w-[calc(100vw-2rem)] text-left animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10`}
          style={{ backgroundColor: 'hsl(var(--card))' }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-[11px] font-semibold text-muted-foreground">
            <span>Website Language</span>
            <span className="text-[10px] text-primary">All pages</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-0.5">
            {QUICK_LANGS.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                      : 'bg-muted/70 hover:bg-muted text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  <div className="min-w-0 pr-1 truncate">
                    <div className="font-semibold truncate leading-tight">{lang.nativeName}</div>
                    <div className={`text-[9px] truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {lang.name}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3 h-3 shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {currentLang !== 'en' && (
            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              className="mt-2 pt-2 border-t border-border/50 w-full text-center text-xs font-semibold text-primary hover:underline cursor-pointer block"
            >
              Reset to English (Original)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
