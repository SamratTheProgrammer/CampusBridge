/**
 * Utility to helper format PDF view/download URLs
 * Uses backend proxy /api/upload/pdf-proxy to bypass Cloudinary raw attachment blocks
 */
import API_BASE from './api';

export const getPdfViewUrl = (url, download = false) => {
  if (!url) return '';
  
  // If it's already proxied, return as is
  if (url.includes('/api/upload/pdf-proxy')) return url;

  // Use backend PDF proxy for any Cloudinary URL or .pdf document link
  if (url.includes('cloudinary') || url.toLowerCase().includes('.pdf')) {
    const encodedUrl = encodeURIComponent(url);
    return `${API_BASE}/api/upload/pdf-proxy?url=${encodedUrl}${download ? '&download=true' : ''}`;
  }

  return url;
};

export const openPdf = (url, download = false) => {
  if (!url) return;
  const viewUrl = getPdfViewUrl(url, download);
  window.open(viewUrl, '_blank', 'noopener,noreferrer');
};
