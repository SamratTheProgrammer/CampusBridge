import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Loader2, Settings, Sparkles, ChevronDown, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import FormattedPostText from './FormattedPostText';
import {
  translateText,
  getPreferredTranslateLang,
  getLanguageByCode,
} from '../../utils/translationService';

const QUICK_INDIAN_LANGS = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
];

/**
 * PostCaption Component
 * Renders post caption with link formatting, desktop hover settings hint,
 * phone-friendly tap picker, instant regional language switcher (Hindi, Bengali, etc.),
 * and dynamic one-click translation.
 */
const PostCaption = ({
  content,
  bgGradient = null,
  className = '',
  textClassName = '',
}) => {
  const navigate = useNavigate();
  const [targetLang, setTargetLang] = useState(getPreferredTranslateLang);
  const [activeTranslatedLang, setActiveTranslatedLang] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Sync target language whenever user changes preference in Settings
  useEffect(() => {
    const onLangChange = (e) => {
      if (e.detail) {
        setTargetLang(e.detail);
      }
    };

    window.addEventListener('campusbridge_translate_lang_change', onLangChange);
    return () => {
      window.removeEventListener('campusbridge_translate_lang_change', onLangChange);
    };
  }, []);

  // Reset translation if original content changes (e.g. post edit)
  useEffect(() => {
    setIsTranslated(false);
    setTranslatedText('');
    setActiveTranslatedLang('');
  }, [content]);

  // Handle outside click / touch on mobile to close popover
  useEffect(() => {
    const handleDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setIsHovered(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('touchstart', handleDocClick);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('touchstart', handleDocClick);
    };
  }, []);

  if (!content || typeof content !== 'string' || !content.trim()) {
    return null;
  }

  const targetLangObj = getLanguageByCode(activeTranslatedLang || targetLang);

  const handleTranslate = async (e, specificLang = null) => {
    if (e) e.stopPropagation();
    if (isLoading) return;

    const langToUse = specificLang || targetLang;
    setIsLoading(true);
    setIsMenuOpen(false);
    setIsHovered(false);
    try {
      const res = await translateText(content, langToUse);
      setTranslatedText(res.translatedText);
      setActiveTranslatedLang(langToUse);
      setIsTranslated(true);
    } catch (err) {
      console.error('Caption translation failed:', err);
      toast.error('Could not translate caption. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeeOriginal = (e) => {
    if (e) e.stopPropagation();
    setIsTranslated(false);
  };

  const handleMouseEnter = () => {
    // Only trigger hover on devices that support true hover (e.g. mouse on desktop/laptop)
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover)').matches) {
      return;
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover)').matches) {
      return;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  const showPicker = (isHovered || isMenuOpen) && !isTranslated;
  const activeText = isTranslated ? translatedText : content;

  // Render for gradient background posts
  if (bgGradient) {
    return (
      <div
        className={`w-full min-h-[250px] rounded-xl flex flex-col items-center justify-center p-6 ${bgGradient} mb-4 relative overflow-visible group shadow-sm ${className}`}
      >
        <h2 className="text-white text-2xl md:text-3xl font-bold text-center leading-snug whitespace-pre-wrap drop-shadow-md my-auto">
          <FormattedPostText text={activeText} isGradient={true} />
        </h2>

        {/* Floating Translate Pill for Gradient Posts */}
        <div 
          ref={containerRef}
          className={`mt-4 pt-2 border-t border-white/15 w-full flex justify-center relative ${showPicker ? 'z-40' : 'z-0'}`}
        >
          {/* Hover / Tap Language Picker for Gradient */}
          {showPicker && (
            <div 
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="absolute bottom-full mb-3 z-50 p-3.5 sm:p-4 bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl text-xs w-[340px] sm:w-[390px] max-w-[calc(100vw-2rem)] text-left animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10"
              style={{ backgroundColor: '#09090b' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">Translate Caption</h4>
                    <p className="text-[10px] text-white/70 leading-tight mt-0.5">Select instant language</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); setIsHovered(false); }}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Language Selection Grid (2 Columns, spacious) */}
              <div className="grid grid-cols-2 gap-2">
                {QUICK_INDIAN_LANGS.map((lang) => {
                  const isSelected = targetLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={(e) => handleTranslate(e, lang.code)}
                      className={`group relative flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer border ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-xs font-semibold ring-2 ring-primary/30'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-white/30'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-xs font-bold leading-tight truncate">{lang.native}</div>
                        <div className={`text-[10px] leading-tight mt-0.5 truncate ${
                          isSelected ? 'text-white/80' : 'text-white/60 group-hover:text-white/90'
                        }`}>
                          {lang.name}
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0 text-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/50 group-hover:text-white/90 font-medium shrink-0 transition-colors">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-white/70">
                  <Settings className="w-3.5 h-3.5 text-primary-300 shrink-0" />
                  <span>Default: <strong className="text-white font-semibold">{targetLangObj.name}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setIsHovered(false);
                    const role = sessionStorage.getItem('campusbridge_user_role') || 'student';
                    navigate(['mentor', 'alumni'].includes(role) ? '/mentor-dashboard/settings' : '/dashboard/settings');
                  }}
                  className="font-semibold text-primary-300 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Settings →
                </button>
              </div>
            </div>
          )}

          {!isTranslated ? (
            <div className="inline-flex items-center rounded-full bg-black/40 hover:bg-black/60 border border-white/25 backdrop-blur-md transition-all shadow-sm">
              <button
                type="button"
                onClick={(e) => handleTranslate(e)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-white/95 text-xs font-semibold cursor-pointer disabled:opacity-60"
                title={`Translate this post to ${targetLangObj.name} (${targetLangObj.nativeName})`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Translating to {targetLangObj.name}...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-white/90" />
                    <span>Translate to {targetLangObj.name}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="px-2 py-1.5 border-l border-white/20 text-white/80 hover:text-white cursor-pointer"
                title="Choose language"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 border border-white/20 backdrop-blur-md text-xs shadow-sm">
              <span className="text-white/90 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary-200" />
                Translated to {targetLangObj.name}
              </span>
              <span className="text-white/40">•</span>
              <button
                type="button"
                onClick={handleSeeOriginal}
                className="text-white font-bold hover:underline cursor-pointer"
              >
                See Original
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render for standard feed & profile posts
  return (
    <div className={`mb-3 ${className}`}>
      <p
        className={`text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed ${textClassName}`}
      >
        <FormattedPostText text={activeText} />
      </p>

      {/* Translation Action Toggle Bar */}
      <div 
        ref={containerRef}
        className={`mt-1.5 relative inline-block ${showPicker ? 'z-40' : 'z-0'}`}
      >
        {/* Dropdown Menu / Tooltip: Opens DOWNWARD with premium wide 2-column layout */}
        {showPicker && (
          <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute top-full left-0 mt-2 z-50 p-3.5 sm:p-4 bg-card border border-border rounded-2xl shadow-2xl text-xs w-[340px] sm:w-[390px] max-w-[calc(100vw-2rem)] text-left animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10"
            style={{ backgroundColor: 'hsl(var(--card))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">Translate Caption</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Select instant language</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); setIsHovered(false); }}
                className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Language Selection Grid (2 Columns, spacious) */}
            <div className="grid grid-cols-2 gap-2">
              {QUICK_INDIAN_LANGS.map((lang) => {
                const isSelected = targetLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={(e) => handleTranslate(e, lang.code)}
                    className={`group relative flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold ring-2 ring-primary/20'
                        : 'bg-muted/70 hover:bg-muted text-foreground border-border hover:border-primary/40 hover:shadow-xs'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-xs font-bold leading-tight truncate">{lang.native}</div>
                      <div className={`text-[10px] leading-tight mt-0.5 truncate ${
                        isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground group-hover:text-foreground/80'
                      }`}>
                        {lang.name}
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 group-hover:text-primary font-medium shrink-0 transition-colors">
                        Select
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Settings className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Default: <strong className="text-foreground font-semibold">{targetLangObj.name}</strong></span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  setIsHovered(false);
                  const role = sessionStorage.getItem('campusbridge_user_role') || 'student';
                  navigate(['mentor', 'alumni'].includes(role) ? '/mentor-dashboard/settings' : '/dashboard/settings');
                }}
                className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
              >
                Settings →
              </button>
            </div>
          </div>
        )}

        {!isTranslated ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => handleTranslate(e)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-60 group/trans"
              title={`Translate caption to ${targetLangObj.name} (${targetLangObj.nativeName})`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Translating to {targetLangObj.name}...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 transition-transform group-hover/trans:rotate-12" />
                  <span>Translate to {targetLangObj.name}</span>
                </>
              )}
            </button>
            {/* Phone tap trigger & desktop hover arrow */}
            <button
              type="button"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded-md text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              title="Choose language"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
              <Globe className="w-3.5 h-3.5 text-primary" />
              Translated to {targetLangObj.name}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <button
              type="button"
              onClick={handleSeeOriginal}
              className="font-semibold text-primary hover:underline cursor-pointer"
            >
              See Original
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCaption;

