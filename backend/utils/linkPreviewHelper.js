/**
 * Link Preview Helper
 * Detects and extracts rich metadata from YouTube, Instagram, Facebook, Google Drive,
 * direct media (images, videos, audio), and generic web links (OpenGraph / HTML metadata).
 */

const decodeHtmlEntities = (str) => {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
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
 * Instagram detection and extraction
 */
export const parseInstagramUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const instaRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i;
  const match = url.match(instaRegex);
  if (!match || !match[1]) return null;

  const shortcode = match[1];
  const isReel = url.includes('/reel/');

  return {
    mediaType: 'instagram',
    shortcode,
    isReel,
    url,
    title: isReel ? 'Instagram Reel' : 'Instagram Post',
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

  const isVideo = url.includes('/videos/') || url.includes('/watch') || url.includes('/reel/') || url.includes('fb.watch');

  return {
    mediaType: 'facebook',
    isVideo,
    url,
    title: isVideo ? 'Facebook Video' : 'Facebook Post',
    embedUrl: isVideo
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500`
      : `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`,
    siteName: 'Facebook',
    domain: 'facebook.com'
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

  // 3. Instagram
  const instaData = parseInstagramUrl(formattedUrl);
  if (instaData) {
    return { success: true, ...instaData };
  }

  // 4. Facebook
  const fbData = parseFacebookUrl(formattedUrl);
  if (fbData) {
    return { success: true, ...fbData };
  }

  // 5. Direct Media (Images, Videos, Audio)
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
