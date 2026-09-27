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
  return /instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i.test(url);
};

export const isFacebookUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /(?:facebook\.com|fb\.watch)/i.test(url);
};

export const isReelUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /(?:reel|reels|shorts|tiktok\.com)/i.test(url);
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
 * High-definition Reel & Video Poster SVG generator
 * Generates an instant, zero-latency visual thumbnail poster for any reel/video
 */
export const generateReelPosterSvg = ({ platform = 'instagram' } = {}) => {
  const isInsta = platform === 'instagram';
  const isFb = platform === 'facebook';

  const gradientDef = isInsta ? `
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#fd1d1d" stop-opacity="0.32" />
      <stop offset="35%" stop-color="#833ab4" stop-opacity="0.22" />
      <stop offset="70%" stop-color="#f58529" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#07080b" stop-opacity="0" />
    </radialGradient>
  ` : isFb ? `
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1877f2" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#0d234a" stop-opacity="0.20" />
      <stop offset="100%" stop-color="#07080b" stop-opacity="0" />
    </radialGradient>
  ` : `
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#4f46e5" stop-opacity="0.20" />
      <stop offset="100%" stop-color="#07080b" stop-opacity="0" />
    </radialGradient>
  `;

  // Subtle watermark icon at center (opacity 0.12)
  const watermark = isInsta ? `
    <g transform="translate(365, 190) scale(3)" opacity="0.12" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </g>
  ` : isFb ? `
    <g transform="translate(365, 190) scale(3)" opacity="0.12" fill="#ffffff">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </g>
  ` : `
    <g transform="translate(365, 190) scale(3)" opacity="0.12" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </g>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      ${gradientDef}
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#13151c" />
        <stop offset="100%" stop-color="#07080b" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#cardBg)" />
    <rect width="800" height="450" fill="url(#bgGlow)" />
    <g opacity="0.04" stroke="#ffffff" stroke-width="1">
      <line x1="0" y1="112" x2="800" y2="112" />
      <line x1="0" y1="225" x2="800" y2="225" />
      <line x1="0" y1="337" x2="800" y2="337" />
      <line x1="200" y1="0" x2="200" y2="450" />
      <line x1="400" y1="0" x2="400" y2="450" />
      <line x1="600" y1="0" x2="600" y2="450" />
    </g>
    ${watermark}
  </svg>`.trim();
};

export const generateReelPosterUrl = (options) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(generateReelPosterSvg(options))}`;
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
  if (isReelUrl(trimmed)) return 'reel';
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
      const match = trimmed.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
      const shortcode = match ? match[1] : '';
      const isReel = trimmed.includes('/reel/') || trimmed.includes('/reels/');
      const title = isReel ? (shortcode ? `Instagram Reel • @${shortcode}` : 'Instagram Reel') : 'Instagram Post';

      return {
        url: trimmed,
        mediaType: 'instagram',
        isReel,
        shortcode,
        title,
        thumbnailUrl: generateReelPosterUrl({ platform: 'instagram', shortcode, isReel, title }),
        embedUrl: shortcode ? `https://www.instagram.com/p/${shortcode}/embed` : '',
        domain: 'instagram.com',
        siteName: 'Instagram'
      };
    }

    if (type === 'facebook') {
      const isVideo = trimmed.includes('/videos/') || trimmed.includes('/watch') || trimmed.includes('/reel') || trimmed.includes('/reels') || trimmed.includes('fb.watch');
      const isReel = trimmed.includes('/reel') || trimmed.includes('/reels') || trimmed.includes('fb.watch');
      const title = isReel ? 'Facebook Reel' : (isVideo ? 'Facebook Video' : 'Facebook Post');

      return {
        url: trimmed,
        mediaType: 'facebook',
        isVideo,
        isReel,
        title,
        thumbnailUrl: generateReelPosterUrl({ platform: 'facebook', isReel, title }),
        embedUrl: isVideo
          ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false&width=500`
          : `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(trimmed)}&show_text=true&width=500`,
        domain: 'facebook.com',
        siteName: 'Facebook'
      };
    }

    if (type === 'reel') {
      const isReel = true;
      const title = 'Reel Video';
      return {
        url: trimmed,
        mediaType: 'reel',
        isReel,
        title,
        thumbnailUrl: generateReelPosterUrl({ platform: 'reel', isReel, title }),
        embedUrl: trimmed,
        domain,
        siteName: domain || 'Reels'
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
        thumbnailUrl: generateReelPosterUrl({ platform: 'reel', isReel: true, title: 'Video File' }),
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
