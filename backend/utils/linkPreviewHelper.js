/**
 * Link Preview Helper
 * Detects and extracts rich metadata from YouTube, Instagram, Facebook, Google Drive,
 * direct media (images, videos, audio), and generic web links (OpenGraph / HTML metadata).
 */

const decodeHtmlEntities = (str) => {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => {
      try { return String.fromCharCode(parseInt(dec, 10)); } catch { return ''; }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try { return String.fromCharCode(parseInt(hex, 16)); } catch { return ''; }
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
};

const getDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

/**
 * YouTube detection and metadata extraction
 */
export const parseYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(ytRegex);
  if (!match || !match[1]) return null;

  const videoId = match[1];
  const isShorts = url.includes('/shorts/');

  return {
    mediaType: 'youtube',
    videoId,
    isShorts,
    url,
    title: isShorts ? 'YouTube Short' : 'YouTube Video',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    siteName: 'YouTube',
    domain: 'youtube.com'
  };
};

/**
 * Google Drive / Docs / Sheets / Slides detection and extraction
 */
export const parseGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  // Google Docs
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
  if (docsMatch && docsMatch[1]) {
    const fileId = docsMatch[1];
    return {
      mediaType: 'drive',
      driveFileType: 'document',
      driveFileId: fileId,
      url,
      title: 'Google Docs Document',
      embedUrl: `https://docs.google.com/document/d/${fileId}/preview`,
      siteName: 'Google Docs',
      domain: 'docs.google.com'
    };
  }

  // Google Sheets
  const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
  if (sheetsMatch && sheetsMatch[1]) {
    const fileId = sheetsMatch[1];
    return {
      mediaType: 'drive',
      driveFileType: 'spreadsheet',
      driveFileId: fileId,
      url,
      title: 'Google Sheets Spreadsheet',
      embedUrl: `https://docs.google.com/spreadsheets/d/${fileId}/preview?widget=true&headers=false`,
      siteName: 'Google Sheets',
      domain: 'docs.google.com'
    };
  }

  // Google Slides
  const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i);
  if (slidesMatch && slidesMatch[1]) {
    const fileId = slidesMatch[1];
    return {
      mediaType: 'drive',
      driveFileType: 'presentation',
      driveFileId: fileId,
      url,
      title: 'Google Slides Presentation',
      embedUrl: `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`,
      siteName: 'Google Slides',
      domain: 'docs.google.com'
    };
  }

  // Google Drive File (PDF, Video, Image, Zip, etc.)
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
                     url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      mediaType: 'drive',
      driveFileType: 'file',
      driveFileId: fileId,
      url,
      title: 'Google Drive File',
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      siteName: 'Google Drive',
      domain: 'drive.google.com'
    };
  }

  return null;
};

/**
 * Reel & Video Poster SVG generator
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
 * Instagram detection and extraction
 */
export const parseInstagramUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const instaRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i;
  const match = url.match(instaRegex);
  if (!match || !match[1]) return null;

  const shortcode = match[1];
  const isReel = url.includes('/reel/') || url.includes('/reels/');
  const title = isReel ? (shortcode ? `Instagram Reel • @${shortcode}` : 'Instagram Reel') : 'Instagram Post';

  return {
    mediaType: 'instagram',
    shortcode,
    isReel,
    url,
    title,
    thumbnailUrl: generateReelPosterUrl({ platform: 'instagram', shortcode, isReel, title }),
    embedUrl: `https://www.instagram.com/p/${shortcode}/embed`,
    siteName: 'Instagram',
    domain: 'instagram.com'
  };
};

/**
 * Facebook detection and extraction
 */
export const parseFacebookUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const fbRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook\.com|fb\.watch)/i;
  if (!fbRegex.test(url)) return null;

  const isVideo = url.includes('/videos/') || url.includes('/watch') || url.includes('/reel') || url.includes('/reels') || url.includes('fb.watch');
  const isReel = url.includes('/reel') || url.includes('/reels') || url.includes('fb.watch');
  const title = isReel ? 'Facebook Reel' : (isVideo ? 'Facebook Video' : 'Facebook Post');

  return {
    mediaType: 'facebook',
    isVideo,
    isReel,
    url,
    title,
    thumbnailUrl: generateReelPosterUrl({ platform: 'facebook', isReel, title }),
    embedUrl: isVideo
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500`
      : `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`,
    siteName: 'Facebook',
    domain: 'facebook.com'
  };
};

/**
 * Generic Reel / Video detection
 */
export const parseReelUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const isReel = /(?:reel|reels|shorts|tiktok\.com)/i.test(url);
  if (!isReel) return null;

  const domain = getDomain(url);
  const title = `${domain ? (domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0]) : 'Reel'} Video`;

  return {
    mediaType: 'reel',
    isReel: true,
    url,
    title,
    thumbnailUrl: generateReelPosterUrl({ platform: 'reel', isReel: true, title }),
    embedUrl: url,
    siteName: domain || 'Reel',
    domain: domain || 'reels'
  };
};

/**
 * Direct file type detection
 */
export const parseDirectMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.split('?')[0].toLowerCase();

  // Images
  const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'];
  if (imgExts.some(ext => cleanUrl.endsWith(ext)) ||
      url.includes('images.unsplash.com') ||
      url.includes('i.imgur.com') ||
      url.includes('cloudinary.com/image/upload')) {
    return {
      mediaType: 'image',
      url,
      thumbnailUrl: url,
      title: 'Image',
      siteName: getDomain(url),
      domain: getDomain(url)
    };
  }

  // Videos
  const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mkv'];
  if (videoExts.some(ext => cleanUrl.endsWith(ext)) ||
      url.includes('/video/upload') ||
      url.includes('/videos/')) {
    return {
      mediaType: 'video',
      url,
      thumbnailUrl: generateReelPosterUrl({ platform: 'reel', isReel: true, title: 'Video File' }),
      title: 'Video',
      siteName: getDomain(url),
      domain: getDomain(url)
    };
  }

  // Audio
  const audioExts = ['.mp3', '.wav', '.oga', '.m4a', '.aac', '.flac'];
  if (audioExts.some(ext => cleanUrl.endsWith(ext)) || url.includes('/audio/')) {
    return {
      mediaType: 'audio',
      url,
      title: 'Audio',
      siteName: getDomain(url),
      domain: getDomain(url)
    };
  }

  return null;
};

/**
 * Fetch and extract rich metadata for any URL
 */
export const fetchUrlMetadata = async (targetUrl) => {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('URL is required');
  }

  let formattedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // 1. YouTube
  const ytData = parseYouTubeUrl(formattedUrl);
  if (ytData) {
    try {
      // YouTube oEmbed for official video title and author
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytData.videoId}&format=json`, {
        signal: AbortSignal.timeout(3000)
      });
      if (oembedRes.ok) {
        const oembedJson = await oembedRes.json();
        ytData.title = oembedJson.title || ytData.title;
        ytData.author = oembedJson.author_name || ytData.author;
        if (oembedJson.thumbnail_url) {
          ytData.thumbnailUrl = oembedJson.thumbnail_url;
        }
      }
    } catch {
      // Fallback to defaults already in ytData
    }
    return { success: true, ...ytData };
  }

  // 2. Google Drive / Docs / Sheets
  const driveData = parseGoogleDriveUrl(formattedUrl);
  if (driveData) {
    return { success: true, ...driveData };
  }

  // Helper to scrape OpenGraph with bot headers
  const tryScrapeOg = async (url) => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return null;
      const html = await res.text();
      const ogImg = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
                      html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return {
        image: ogImg ? decodeHtmlEntities(ogImg[1].trim()) : null,
        title: ogTitle ? decodeHtmlEntities(ogTitle[1].trim()) : null
      };
    } catch {
      return null;
    }
  };

  // 3. Instagram
  const instaData = parseInstagramUrl(formattedUrl);
  if (instaData) {
    const scraped = await tryScrapeOg(formattedUrl);
    if (scraped?.image) {
      instaData.thumbnailUrl = scraped.image;
      instaData.image = scraped.image;
    }
    if (scraped?.title && !scraped.title.toLowerCase().includes('login • instagram')) {
      instaData.title = scraped.title;
    }
    return { success: true, ...instaData };
  }

  // 4. Facebook
  const fbData = parseFacebookUrl(formattedUrl);
  if (fbData) {
    const scraped = await tryScrapeOg(formattedUrl);
    if (scraped?.image) {
      fbData.thumbnailUrl = scraped.image;
      fbData.image = scraped.image;
    }
    if (scraped?.title && !scraped.title.toLowerCase().includes('log into facebook')) {
      fbData.title = scraped.title;
    }
    return { success: true, ...fbData };
  }

  // 5. Generic Reel / Shorts
  const reelData = parseReelUrl(formattedUrl);
  if (reelData) {
    const scraped = await tryScrapeOg(formattedUrl);
    if (scraped?.image) {
      reelData.thumbnailUrl = scraped.image;
      reelData.image = scraped.image;
    }
    if (scraped?.title) {
      reelData.title = scraped.title;
    }
    return { success: true, ...reelData };
  }

  // 6. Direct Media (Images, Videos, Audio)
  const directData = parseDirectMediaUrl(formattedUrl);
  if (directData) {
    return { success: true, ...directData };
  }

  // 6. Generic Web Link (OpenGraph / HTML Metadata)
  const domain = getDomain(formattedUrl);
  try {
    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(4500)
    });

    const contentType = response.headers.get('content-type') || '';

    // If response is directly an image or video
    if (contentType.startsWith('image/')) {
      return {
        success: true,
        mediaType: 'image',
        url: formattedUrl,
        thumbnailUrl: formattedUrl,
        title: 'Image',
        siteName: domain,
        domain
      };
    }
    if (contentType.startsWith('video/')) {
      return {
        success: true,
        mediaType: 'video',
        url: formattedUrl,
        title: 'Video',
        siteName: domain,
        domain
      };
    }

    const html = await response.text();

    // Helper regex extractors
    const extractMeta = (regexList) => {
      for (const rx of regexList) {
        const m = html.match(rx);
        if (m && m[1]) return decodeHtmlEntities(m[1].trim());
      }
      return '';
    };

    const title = extractMeta([
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
      /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i,
      /<title[^>]*>([^<]+)<\/title>/i
    ]) || domain;

    const description = extractMeta([
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
      /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i,
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
    ]);

    let image = extractMeta([
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i
    ]);

    if (image && !/^https?:\/\//i.test(image)) {
      try {
        image = new URL(image, formattedUrl).href;
      } catch {
        image = '';
      }
    }

    const siteName = extractMeta([
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i
    ]) || domain;

    let favicon = extractMeta([
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i
    ]);

    if (favicon && !/^https?:\/\//i.test(favicon)) {
      try {
        favicon = new URL(favicon, formattedUrl).href;
      } catch {
        favicon = `https://${domain}/favicon.ico`;
      }
    } else if (!favicon && domain) {
      favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }

    return {
      success: true,
      mediaType: 'link',
      url: formattedUrl,
      title,
      description: description.slice(0, 300),
      thumbnailUrl: image,
      image,
      siteName,
      domain,
      favicon
    };
  } catch (err) {
    // If fetching fails (timeout, blocked, etc.), return graceful basic link preview
    return {
      success: true,
      mediaType: 'link',
      url: formattedUrl,
      title: domain || formattedUrl,
      description: '',
      thumbnailUrl: '',
      siteName: domain,
      domain,
      favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : ''
    };
  }
};
