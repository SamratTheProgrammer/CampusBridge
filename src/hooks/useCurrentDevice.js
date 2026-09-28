import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useCurrentDevice = () => {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    // Initial guess from UA synchronously so there's zero flicker
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    const isNative = typeof window !== 'undefined' && (
      Capacitor.isNativePlatform() || 
      window.Capacitor?.isNativePlatform?.() || 
      ua.includes('CampusBridgeMobile') || 
      ua.includes('Capacitor')
    );

    let os = 'Unknown Device';
    let deviceType = 'desktop';
    let deviceName = 'Desktop Computer';

    if (/iPad|Tablet|PlayBook/i.test(ua)) {
      deviceType = 'tablet';
      os = 'Tablet';
      deviceName = 'Tablet';
    } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType = 'mobile';
      if (/Android/i.test(ua)) {
        os = 'Android Device';
        deviceName = isNative ? 'CampusBridge Android App' : 'Android Smartphone';
      } else if (/iPhone|iPod/i.test(ua)) {
        os = 'Apple iOS Device';
        deviceName = isNative ? 'CampusBridge iOS App' : 'Apple iPhone';
      } else {
        os = 'Mobile Device';
        deviceName = 'Mobile Device';
      }
    } else {
      if (ua.indexOf('Win') !== -1) {
        os = 'Windows PC';
        deviceName = 'Windows PC';
      } else if (ua.indexOf('Mac') !== -1) {
        os = 'MacBook / Mac';
        deviceName = 'MacBook / Mac';
      } else if (ua.indexOf('Linux') !== -1) {
        os = 'Linux Machine';
        deviceName = 'Linux PC';
      }
    }

    let browser = 'Unknown Browser';
    if (isNative) {
      browser = 'CampusBridge Mobile App';
    } else if (ua.indexOf('Firefox') !== -1) {
      browser = 'Firefox';
    } else if (ua.indexOf('Edg') !== -1) {
      browser = 'Microsoft Edge';
    } else if (ua.indexOf('Chrome') !== -1) {
      browser = 'Google Chrome';
    } else if (ua.indexOf('Safari') !== -1) {
      browser = 'Apple Safari';
    }

    // Try reading cached geo from sessionStorage
    let cachedGeo = null;
    try {
      const saved = sessionStorage.getItem('cb_cached_geo');
      if (saved) cachedGeo = JSON.parse(saved);
    } catch (e) {}

    return {
      ip: cachedGeo?.ip || 'Fetching...',
      city: cachedGeo?.city || 'Detecting...',
      region: cachedGeo?.region || '',
      country: cachedGeo?.country || 'Location',
      os,
      browser,
      deviceType,
      deviceName,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isNative,
    };
  });

  useEffect(() => {
    // Check if we already have valid cached geo
    try {
      const saved = sessionStorage.getItem('cb_cached_geo');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ip && parsed.ip !== 'Fetching...' && parsed.ip !== 'Unknown IP') {
          setDeviceInfo(prev => ({
            ...prev,
            ip: parsed.ip,
            city: parsed.city || 'Unknown City',
            region: parsed.region || '',
            country: parsed.country || '',
          }));
          return;
        }
      }
    } catch (e) {}

    // Fetch Geo location
    let isMounted = true;
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const newGeo = {
          ip: data.ip || 'Unknown IP',
          city: data.city || 'Unknown City',
          region: data.region || '',
          country: data.country || 'Unknown Country',
        };
        try {
          sessionStorage.setItem('cb_cached_geo', JSON.stringify(newGeo));
        } catch (e) {}

        setDeviceInfo(prev => ({
          ...prev,
          ...newGeo,
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setDeviceInfo(prev => ({
          ...prev,
          ip: 'IP Protected',
          city: 'Unknown Location',
          country: '',
        }));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return deviceInfo;
};

export default useCurrentDevice;
