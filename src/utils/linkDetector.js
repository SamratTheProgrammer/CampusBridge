import API_BASE from './api';

export const isYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url);
};

export const getYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match ? match[1] : null;
};

export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com|docs\.google\.com/i.test(url);
};

export const isInstagramUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i.test(url);
};

export const isFacebookUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /(?:facebook\.com|fb\.watch)/i.test(url);
};

export const isDirectImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'].some(ext => clean.endsWith(ext)) ||
    url.includes('images.unsplash.com') ||
    url.includes('i.imgur.com') ||
    url.includes('cloudinary.com/image/upload')
  );
};

export const isDirectVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mkv'].some(ext => clean.endsWith(ext)) ||
    url.includes('/video/upload') ||
    url.includes('/videos/')
  );
};

export const isDirectAudioUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    ['.mp3', '.wav', '.oga', '.m4a', '.aac', '.flac'].some(ext => clean.endsWith(ext)) ||
    url.includes('/audio/')
  );
};

/**
 * Fast synchronous media type determination from URL
 */
export const detectMediaType = (url) => {
  if (!url || typeof url !== 'string') return 'link';
  const trimmed = url.trim();

  if (isYouTubeUrl(trimmed)) return 'youtube';
  if (isGoogleDriveUrl(trimmed)) return 'drive';
  if (isInstagramUrl(trimmed)) return 'instagram';
  if (isFacebookUrl(trimmed)) return 'facebook';
  if (isDirectImageUrl(trimmed)) return 'image';
  if (isDirectVideoUrl(trimmed)) return 'video';
  if (isDirectAudioUrl(trimmed)) return 'audio';

  return 'link';
};

/**
 * Extract initial instant metadata for URLs without waiting for network
 */
export const getInstantUrlPreview = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const type = detectMediaType(trimmed);

  try {
    const domain = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).hostname.replace(/^www\./, '');

    if (type === 'youtube') {
      const videoId = getYouTubeVideoId(trimmed);
      return {
        url: trimmed,
        mediaType: 'youtube',
        videoId,
        title: trimmed.includes('/shorts/') ? 'YouTube Short' : 'YouTube Video',
        thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
        embedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : '',
        domain: 'youtube.com',
        siteName: 'YouTube'
      };
    }

    if (type === 'drive') {
      const isDoc = trimmed.includes('docs.google.com/document');
      const isSheet = trimmed.includes('docs.google.com/spreadsheets');
      const isSlide = trimmed.includes('docs.google.com/presentation');
      let driveFileType = 'file';
      let title = 'Google Drive File';
      let embedUrl = '';

      const fileMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const fileId = fileMatch ? fileMatch[1] : '';

      if (isDoc) {
        driveFileType = 'document';
        title = 'Google Docs Document';
        embedUrl = fileId ? `https://docs.google.com/document/d/${fileId}/preview` : '';
      } else if (isSheet) {
        driveFileType = 'spreadsheet';
        title = 'Google Sheets Spreadsheet';
        embedUrl = fileId ? `https://docs.google.com/spreadsheets/d/${fileId}/preview?widget=true&headers=false` : '';
      } else if (isSlide) {
        driveFileType = 'presentation';
        title = 'Google Slides Presentation';
        embedUrl = fileId ? `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000` : '';
      } else if (fileId) {
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }

      return {
        url: trimmed,
        mediaType: 'drive',
        driveFileType,
        driveFileId: fileId,
        title,
        thumbnailUrl: fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : '',
        embedUrl,
        domain: 'drive.google.com',
        siteName: 'Google Drive'
      };
    }

    if (type === 'instagram') {
      return {
        url: trimmed,
        mediaType: 'instagram',
        title: trimmed.includes('/reel/') ? 'Instagram Reel' : 'Instagram Post',
        domain: 'instagram.com',
        siteName: 'Instagram'
      };
    }

    if (type === 'facebook') {
      return {
        url: trimmed,
        mediaType: 'facebook',
        title: trimmed.includes('/reel/') || trimmed.includes('/videos/') ? 'Facebook Video' : 'Facebook Post',
        domain: 'facebook.com',
        siteName: 'Facebook'
      };
    }

    if (type === 'image') {
      return {
        url: trimmed,
        mediaType: 'image',
        title: 'Image',
        thumbnailUrl: trimmed,
        domain
      };
    }

    if (type === 'video') {
      return {
        url: trimmed,
        mediaType: 'video',
        title: 'Video',
        domain
      };
    }

    return {
      url: trimmed,
      mediaType: 'link',
      title: domain,
      domain,
      siteName: domain
    };
  } catch {
    return null;
  }
};

/**
 * Fetch full server-side metadata for a URL
 */
export const fetchLinkMetadata = async (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const res = await fetch(`${API_BASE}/api/posts/link-preview?url=${encodeURIComponent(url.trim())}`);
    if (res.ok) {
      return await res.json();
    }
    return getInstantUrlPreview(url);
  } catch {
    return getInstantUrlPreview(url);
  }
};

/**
 * Find first valid URL in text
 */
export const findFirstUrl = (text) => {
  if (!text || typeof text !== 'string') return null;
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};
