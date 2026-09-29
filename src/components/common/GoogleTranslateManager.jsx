import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getWebsiteLanguage } from '../../utils/translationService';

/**
 * GoogleTranslateManager Component
 * Ensures persistent, unbroken whole-website translation across all routes and dynamic data.
 * Does not render any visible or duplicate DOM elements.
 */
const GoogleTranslateManager = () => {
  const location = useLocation();

  // On route transition or initial mount: keep translation active
  useEffect(() => {
    const activeLang = getWebsiteLanguage();
    if (!activeLang || activeLang === 'en') return;

    const syncCombo = () => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        if (select.value !== activeLang) {
          select.value = activeLang;
          select.dispatchEvent(new Event('change'));
        }
      }
    };

    // Immediate check
    syncCombo();

    // Staggered timers to catch dynamically fetched data (e.g. posts, user profiles, notifications)
    const t1 = setTimeout(syncCombo, 150);
    const t2 = setTimeout(syncCombo, 500);
    const t3 = setTimeout(syncCombo, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  // Listen for explicit custom event from language switcher or settings
  useEffect(() => {
    const onSiteLangChange = (e) => {
      const langCode = e.detail;
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = langCode === 'en' ? '' : langCode;
        select.dispatchEvent(new Event('change'));
      }
    };

    window.addEventListener('campusbridge_site_lang_change', onSiteLangChange);
    return () => {
      window.removeEventListener('campusbridge_site_lang_change', onSiteLangChange);
    };
  }, []);

  return null;
};

export default GoogleTranslateManager;
