import { useState, useEffect } from 'react';

export const useCurrentDevice = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    ip: 'Fetching...',
    city: 'Detecting...',
    country: 'Location',
    os: 'Unknown OS',
    browser: 'Unknown Browser'
  });

  useEffect(() => {
    // Get Browser & OS
    const ua = window.navigator.userAgent;
    let os = 'Unknown Device';
    if (ua.indexOf('Win') !== -1) os = 'Windows PC';
    if (ua.indexOf('Mac') !== -1) os = 'MacBook / Mac';
    if (ua.indexOf('Linux') !== -1) os = 'Linux Machine';
    if (ua.indexOf('Android') !== -1) os = 'Android Device';
    if (ua.indexOf('like Mac') !== -1) os = 'Apple iOS Device';

    let browser = 'Unknown Browser';
    if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (ua.indexOf('Edg') !== -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') !== -1) browser = 'Safari';

    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(res => res.json())
      .then(data => {
        setDeviceInfo({
          ip: data.ip || 'Unknown IP',
          city: data.city || 'Unknown City',
          country: data.country || 'Unknown Country',
          os,
          browser
        });
      })
      .catch(() => {
        setDeviceInfo(prev => ({ ...prev, ip: 'IP Hidden', city: 'Unknown Location', country: '' }));
      });
  }, []);

  return deviceInfo;
};
