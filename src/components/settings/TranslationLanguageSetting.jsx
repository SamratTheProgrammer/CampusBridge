import React, { useState, useEffect } from 'react';
import { Languages, Globe, Check, Sparkles, RefreshCw, Layout, MessageSquare } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import {
  SUPPORTED_TRANSLATION_LANGUAGES,
  DEFAULT_TRANSLATE_LANG,
  getPreferredTranslateLang,
  setPreferredTranslateLang,
  getWebsiteLanguage,
  setWebsiteLanguage,
  getLanguageByCode,
} from '../../utils/translationService';

const POPULAR_SITE_LANGS = [
  { code: 'en', name: 'English (Original)', nativeName: 'English' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

const TranslationLanguageSetting = () => {
  const { user } = useUser();
  const [siteLang, setSiteLang] = useState(getWebsiteLanguage);
  const [captionLang, setCaptionLang] = useState(getPreferredTranslateLang);
  const [isApplying, setIsApplying] = useState(false);

  // Sync state if external change occurs
  useEffect(() => {
    const onSiteChange = (e) => {
      if (e.detail) setSiteLang(e.detail);
    };
    const onCaptionChange = (e) => {
      if (e.detail) setCaptionLang(e.detail);
    };
    window.addEventListener('campusbridge_site_lang_change', onSiteChange);
    window.addEventListener('campusbridge_translate_lang_change', onCaptionChange);
    return () => {
      window.removeEventListener('campusbridge_site_lang_change', onSiteChange);
      window.removeEventListener('campusbridge_translate_lang_change', onCaptionChange);
    };
  }, []);

  // Sync caption preference from Clerk metadata
  useEffect(() => {
    if (user?.unsafeMetadata?.preferredTranslateLang) {
      const clerkLang = user.unsafeMetadata.preferredTranslateLang;
      if (clerkLang !== captionLang) {
        setCaptionLang(clerkLang);
        setPreferredTranslateLang(clerkLang);
      }
    }
  }, [user?.unsafeMetadata?.preferredTranslateLang]);

  // Handle switching Whole Website Language
  const handleSelectSiteLang = (langCode) => {
    if (langCode === siteLang) return;
    setIsApplying(true);
    setSiteLang(langCode);
    setWebsiteLanguage(langCode);

    const langObj = getLanguageByCode(langCode);
    if (langCode === 'en') {
      toast.success('Website restored to original English', { icon: '🌐' });
    } else {
      toast.success(`Translating entire website to ${langObj.nativeName} (${langObj.name})...`, { icon: '✨' });
    }

    setTimeout(() => {
      setIsApplying(false);
    }, 600);
  };

  // Handle switching Post Caption Target Language
  const handleSelectCaptionLang = async (langCode) => {
    if (langCode === captionLang) return;
    setCaptionLang(langCode);
    setPreferredTranslateLang(langCode);

    const langObj = getLanguageByCode(langCode);
    toast.success(`Post caption default set to ${langObj.name} (${langObj.nativeName})`);

    if (user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            preferredTranslateLang: langCode,
          },
        });
      } catch (err) {
        console.debug('Failed to sync to Clerk:', err);
      }
    }
  };

  const currentSiteLangObj = getLanguageByCode(siteLang);
  const currentCaptionLangObj = getLanguageByCode(captionLang);

  return (
    <div className="space-y-6">
      {/* SECTION 1: FULL WEBSITE TRANSLATION */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-foreground">
                  Whole Website Language
                </h3>
                {siteLang !== 'en' ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Translated: {currentSiteLangObj.nativeName}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Original English
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Translates every button, navigation menu, card, and page across the entire website automatically.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {siteLang !== 'en' && (
              <button
                type="button"
                onClick={() => handleSelectSiteLang('en')}
                className="px-3 py-1.5 rounded-xl border border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-semibold transition-colors cursor-pointer"
                title="Reset back to English"
              >
                Reset to English
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/50 text-xs font-semibold text-foreground">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{siteLang === 'en' ? 'English' : `${currentSiteLangObj.nativeName} (${currentSiteLangObj.name})`}</span>
            </div>
          </div>
        </div>

        {/* Quick Select Buttons for Website Language */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Popular Languages</span>
            <span className="text-[11px] text-muted-foreground font-normal">One-click translation</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {POPULAR_SITE_LANGS.map((lang) => {
              const isSelected = siteLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectSiteLang(lang.code)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold ring-2 ring-primary/20'
                      : 'bg-muted/30 hover:bg-muted/80 text-foreground border-border/50 hover:border-primary/40'
                  }`}
                >
                  <div className="min-w-0 pr-1 truncate">
                    <div className="text-xs font-bold leading-tight truncate">{lang.nativeName}</div>
                    <div className={`text-[10px] leading-tight mt-0.5 truncate ${
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {lang.name}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* All Supported Languages Dropdown for Website */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>All Languages ({SUPPORTED_TRANSLATION_LANGUAGES.length} available)</span>
          </label>
          <select
            value={siteLang}
            onChange={(e) => handleSelectSiteLang(e.target.value)}
            className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer font-medium"
          >
            <option value="en">English (Default / Original)</option>
            {SUPPORTED_TRANSLATION_LANGUAGES.filter(l => l.code !== 'en').map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} — {lang.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* Feature Hint Box */}
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-foreground font-semibold">Real-Time Full Page Translation: </strong>
            Selecting any language here immediately translates all navigation menus, dashboard widgets, buttons, forms, and pages. You can switch back to English anytime.
          </div>
        </div>
      </div>

      {/* SECTION 2: POST CAPTION DEFAULT TRANSLATION */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">
                  Default Post Caption Translation
                </h3>
                {captionLang === DEFAULT_TRANSLATE_LANG && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Default: Hindi
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Default language used when you click "Translate to..." under user posts in feeds and profiles.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/50 text-xs font-semibold text-foreground">
            <Languages className="w-3.5 h-3.5 text-primary" />
            <span>Target: {currentCaptionLangObj.name} ({currentCaptionLangObj.nativeName})</span>
          </div>
        </div>

        {/* Quick Select for Captions */}
        <div className="flex flex-wrap gap-2">
          {['hi', 'bn', 'en', 'mr', 'te', 'ta', 'gu'].map((code) => {
            const lang = getLanguageByCode(code);
            const isSelected = captionLang === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleSelectCaptionLang(code)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/30 text-foreground border-border/50 hover:bg-muted hover:border-border'
                }`}
              >
                <span>{lang.nativeName}</span>
                <span className="text-[10px] opacity-75">({lang.name})</span>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Dropdown for Captions */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">All Caption Languages</label>
          <select
            value={captionLang}
            onChange={(e) => handleSelectCaptionLang(e.target.value)}
            className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer font-medium"
          >
            {SUPPORTED_TRANSLATION_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} — {lang.nativeName} {lang.code === DEFAULT_TRANSLATE_LANG ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TranslationLanguageSetting;
