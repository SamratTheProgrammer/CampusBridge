import React, { useState } from 'react';
import { ExternalLink, Play, X, Globe, Eye, Music, Video as VideoIcon } from 'lucide-react';
import { FaYoutube, FaGoogleDrive, FaInstagram, FaFacebook } from 'react-icons/fa';
import { generateReelPosterUrl } from '../utils/linkDetector';

const decodeText = (str) => {
  if (!str || typeof str !== 'string') return '';
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

export const LinkPreviewCard = ({ 
  preview, 
  onRemove = null, 
  compact = false,
  className = '' 
}) => {
  const [isPlayingYouTube, setIsPlayingYouTube] = useState(false);
  const [isPlayingInstagram, setIsPlayingInstagram] = useState(false);
  const [isPlayingFacebook, setIsPlayingFacebook] = useState(false);
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [showDriveEmbed, setShowDriveEmbed] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!preview || !preview.url) return null;

  const {
    url,
    title,
    description,
    thumbnailUrl,
    image,
    siteName,
    domain,
    mediaType = 'link',
    videoId,
    embedUrl,
    driveFileType,
    author,
    favicon
  } = preview;

  const cleanTitle = decodeText(title);
  const cleanDescription = decodeText(description);
  const cleanAuthor = decodeText(author);

  const displayImage = thumbnailUrl || image;

  // 1. YouTube Player / Card
  if (mediaType === 'youtube' || videoId || url.includes('youtube.com') || url.includes('youtu.be')) {
    const finalEmbed = embedUrl || `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-red-500/40 ${className}`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/10 text-red-600 font-semibold shrink-0">
              <FaYoutube className="w-3.5 h-3.5 text-red-600" />
              <span>YouTube</span>
            </span>
            <span className="font-medium text-muted-foreground truncate">{author || domain || 'youtube.com'}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors flex items-center gap-1 text-[11px]"
              title="Open in YouTube"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Watch</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                title="Remove preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Player / Thumbnail View */}
        <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
          {isPlayingYouTube ? (
            <div className="relative w-full h-full">
              <iframe
                src={finalEmbed}
                title={title || 'YouTube Video'}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <button
                type="button"
                onClick={() => setIsPlayingYouTube(false)}
                className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm transition-all z-10"
              >
                Close Player
              </button>
            </div>
          ) : (
            <div 
              className="relative w-full h-full group cursor-pointer"
              onClick={() => setIsPlayingYouTube(true)}
            >
              <img
                src={displayImage || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={title || 'YouTube thumbnail'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  if (videoId) e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-all">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </div>
              </div>

              {/* Title overlay - only when compact to avoid duplicate display */}
              {compact && cleanTitle && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">
                    {cleanTitle}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Info Bottom Strip */}
        {!compact && cleanTitle && (
          <div className="p-3 bg-card border-t border-border/40">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">{cleanTitle}</h4>
            {cleanAuthor && <p className="text-[11px] text-muted-foreground mt-0.5">By {cleanAuthor}</p>}
          </div>
        )}
      </div>
    );
  }

  // 2. Google Drive / Docs / Sheets / Slides
  if (mediaType === 'drive' || url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const isDoc = driveFileType === 'document' || url.includes('docs.google.com/document');
    const isSheet = driveFileType === 'spreadsheet' || url.includes('docs.google.com/spreadsheets');
    const isSlide = driveFileType === 'presentation' || url.includes('docs.google.com/presentation');
    
    let typeName = 'Google Drive File';
    let badgeColor = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (isDoc) {
      typeName = 'Google Docs';
      badgeColor = 'bg-blue-600/10 text-blue-600 border-blue-600/20';
    } else if (isSheet) {
      typeName = 'Google Sheets';
      badgeColor = 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
    } else if (isSlide) {
      typeName = 'Google Slides';
      badgeColor = 'bg-amber-600/10 text-amber-600 border-amber-600/20';
    }

    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-blue-500/40 ${className}`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold border shrink-0 text-xs ${badgeColor}`}>
              <FaGoogleDrive className="w-3.5 h-3.5" />
              <span>{typeName}</span>
            </span>
            <span className="font-semibold text-foreground truncate">{title || 'Google Drive Document'}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
              title="Open in Google Drive"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Open in Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                title="Remove preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Embedded viewer or Preview Card */}
        {showDriveEmbed && embedUrl ? (
          <div className="relative w-full h-[420px] bg-muted/20 border-b border-border/40">
            <iframe
              src={embedUrl}
              title={title || 'Google Drive Preview'}
              className="w-full h-full border-none"
              allow="autoplay"
            />
            <button
              type="button"
              onClick={() => setShowDriveEmbed(false)}
              className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm transition-all z-10"
            >
              Close Embed
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
            <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <FaGoogleDrive className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-foreground truncate">{title || 'Google Drive Document'}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{domain || 'drive.google.com'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              {embedUrl && (
                <button
                  type="button"
                  onClick={() => setShowDriveEmbed(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview File</span>
                </button>
              )}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span>Open Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Instagram Player / Card
  if (mediaType === 'instagram' || url.includes('instagram.com')) {
    const isReel = preview.isReel || url.includes('/reel/') || url.includes('/reels/');
    const finalShortcode = videoId || preview.shortcode || (url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i)?.[1] || '');
    const finalEmbed = embedUrl || (finalShortcode ? `https://www.instagram.com/p/${finalShortcode}/embed` : '');
    const fallbackPoster = generateReelPosterUrl({ platform: 'instagram', shortcode: finalShortcode, isReel, title });
    const currentImg = displayImage && !imgError ? displayImage : fallbackPoster;

    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-pink-500/40 ${className}`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-orange-500/15 text-pink-600 dark:text-pink-400 font-semibold border border-pink-500/20 shrink-0">
              <FaInstagram className="w-3.5 h-3.5" />
              <span>{isReel ? 'Instagram Reel' : 'Instagram'}</span>
            </span>
            <span className="font-medium text-muted-foreground truncate">{author || (finalShortcode ? `@${finalShortcode}` : 'instagram.com')}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors flex items-center gap-1 text-[11px]"
              title="Open in Instagram"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Watch</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                title="Remove preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Player / Thumbnail View */}
        <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
          {isPlayingInstagram && finalEmbed ? (
            <div className="relative w-full h-full bg-zinc-950">
              <iframe
                src={finalEmbed}
                title={title || 'Instagram Reel'}
                className="w-full h-full border-none"
                allow="autoplay; encrypted-media"
                allowTransparency="true"
              />
              <button
                type="button"
                onClick={() => setIsPlayingInstagram(false)}
                className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm transition-all z-10 cursor-pointer"
              >
                Close Player
              </button>
            </div>
          ) : (
            <div 
              className="relative w-full h-full group cursor-pointer"
              onClick={() => setIsPlayingInstagram(true)}
            >
              <img
                src={currentImg}
                alt={title || 'Instagram Reel thumbnail'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />

              {/* Reel tag top left */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold tracking-wider shadow-sm">
                <FaInstagram className="w-3 h-3 text-pink-400" />
                <span>{isReel ? 'REEL' : 'POST'}</span>
              </div>

              {/* Center Play Button with Instagram Gradient */}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/30 group-hover:scale-110 active:scale-95 transition-all">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </div>
              </div>

              {/* Title overlay - only when compact to avoid duplicate display */}
              {compact && (cleanTitle || finalShortcode) && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">
                    {cleanTitle || (finalShortcode ? `Instagram Reel • @${finalShortcode}` : 'Instagram Reel')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Info Bottom Strip */}
        {!compact && (cleanTitle || finalShortcode) && (
          <div className="p-3 bg-card border-t border-border/40">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">
              {cleanTitle || (finalShortcode ? `Instagram Reel • @${finalShortcode}` : 'Instagram Reel')}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
              <span>{cleanAuthor ? `By ${cleanAuthor} • ` : ''}Instagram {isReel ? 'Reel' : 'Post'}</span>
              <span className="text-border/80">•</span>
              <span className="flex items-center gap-1 text-pink-500 font-medium">
                <Music className="w-3 h-3" /> Original Audio
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Facebook Player / Card
  if (mediaType === 'facebook' || url.includes('facebook.com') || url.includes('fb.watch')) {
    const isReel = preview.isReel || url.includes('/reel') || url.includes('/reels') || url.includes('fb.watch');
    const isVideo = preview.isVideo || isReel || url.includes('/videos/') || url.includes('/watch');
    const finalEmbed = embedUrl || (isVideo
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500`
      : `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`);
    const fallbackPoster = generateReelPosterUrl({ platform: 'facebook', isReel, title: cleanTitle });
    const currentImg = displayImage && !imgError ? displayImage : fallbackPoster;

    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-blue-600/40 ${className}`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-600 font-semibold border border-blue-600/20 shrink-0">
              <FaFacebook className="w-3.5 h-3.5" />
              <span>{isReel ? 'Facebook Reel' : (isVideo ? 'Facebook Video' : 'Facebook')}</span>
            </span>
            <span className="font-medium text-muted-foreground truncate">{cleanAuthor || domain || 'facebook.com'}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors flex items-center gap-1 text-[11px]"
              title="Open in Facebook"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Watch</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                title="Remove preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Player / Thumbnail View */}
        <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
          {isPlayingFacebook && finalEmbed ? (
            <div className="relative w-full h-full bg-zinc-950">
              <iframe
                src={finalEmbed}
                title={cleanTitle || 'Facebook Video'}
                className="w-full h-full border-none"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
              <button
                type="button"
                onClick={() => setIsPlayingFacebook(false)}
                className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm transition-all z-10 cursor-pointer"
              >
                Close Player
              </button>
            </div>
          ) : (
            <div 
              className="relative w-full h-full group cursor-pointer"
              onClick={() => setIsPlayingFacebook(true)}
            >
              <img
                src={currentImg}
                alt={cleanTitle || 'Facebook thumbnail'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />

              {/* Reel/Video/Post tag top left */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold tracking-wider shadow-sm">
                <FaFacebook className="w-3 h-3 text-blue-400" />
                <span>{isReel ? 'REEL' : (isVideo ? 'VIDEO' : 'POST')}</span>
              </div>

              {/* Center Play Button for Video/Reel */}
              {(isVideo || isReel) && (
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 active:scale-95 transition-all">
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                  </div>
                </div>
              )}

              {/* Title overlay - only when compact to avoid duplicate display */}
              {compact && cleanTitle && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">
                    {cleanTitle}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Info Bottom Strip */}
        {!compact && cleanTitle && (
          <div className="p-3 bg-card border-t border-border/40">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">{cleanTitle}</h4>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
              <span>{cleanAuthor ? `By ${cleanAuthor} • ` : ''}Facebook {isReel ? 'Reel' : (isVideo ? 'Video' : 'Post')}</span>
              {(isVideo || isReel) && (
                <>
                  <span className="text-border/80">•</span>
                  <span className="flex items-center gap-1 text-blue-500 font-medium">
                    <Music className="w-3 h-3" /> Original Audio
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. Generic Reel / Video Player / Card
  if (mediaType === 'reel' || url.includes('/reel/') || url.includes('/reels/') || url.includes('tiktok.com')) {
    const isReel = true;
    const fallbackPoster = generateReelPosterUrl({ platform: 'reel', isReel, title: cleanTitle });
    const currentImg = displayImage && !imgError ? displayImage : fallbackPoster;

    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-purple-500/40 ${className}`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-600/10 text-purple-600 font-semibold border border-purple-600/20 shrink-0">
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Reel Video</span>
            </span>
            <span className="font-medium text-muted-foreground truncate">{cleanAuthor || domain || 'Reels'}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors flex items-center gap-1 text-[11px]"
              title="Open Reel"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Watch</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                title="Remove preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Thumbnail / Player View */}
        <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
          {isPlayingReel ? (
            <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center">
              {url.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={url} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <iframe
                  src={embedUrl || url}
                  title={cleanTitle || 'Reel Video'}
                  className="w-full h-full border-none"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )}
              <button
                type="button"
                onClick={() => setIsPlayingReel(false)}
                className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm transition-all z-10 cursor-pointer"
              >
                Close Player
              </button>
            </div>
          ) : (
            <div 
              className="relative w-full h-full group cursor-pointer"
              onClick={() => {
                if (url.match(/\.(mp4|webm|ogg)$/i) || embedUrl) {
                  setIsPlayingReel(true);
                } else {
                  window.open(url, '_blank');
                }
              }}
            >
              <img
                src={currentImg}
                alt={cleanTitle || 'Reel thumbnail'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />

              {/* Reel tag top left */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold tracking-wider shadow-sm">
                <VideoIcon className="w-3 h-3 text-purple-400" />
                <span>REEL</span>
              </div>

              {/* Center Play Button with Purple Glow */}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 group-hover:scale-110 active:scale-95 transition-all">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </div>
              </div>

              {/* Title overlay - only when compact to avoid duplicate display */}
              {compact && cleanTitle && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">
                    {cleanTitle}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Info Bottom Strip */}
        {!compact && cleanTitle && (
          <div className="p-3 bg-card border-t border-border/40">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">{cleanTitle}</h4>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
              <span>{domain || 'Reel Video'}</span>
              <span className="text-border/80">•</span>
              <span className="flex items-center gap-1 text-purple-500 font-medium">
                <Music className="w-3 h-3" /> Original Audio
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. Generic Web Link (OpenGraph Card)
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md ${className}`}>
      {/* Top Banner Image if available */}
      {displayImage && !imgError && (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block relative w-full h-44 sm:h-52 bg-muted overflow-hidden group cursor-pointer"
        >
          <img
            src={displayImage}
            alt={cleanTitle || 'Link preview banner'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer shadow-sm"
              title="Remove preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </a>
      )}

      {/* Content Details */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3.5 sm:p-4 group cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0 text-xs text-muted-foreground">
            {favicon ? (
              <img src={favicon} alt="" className="w-4 h-4 rounded-sm object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <Globe className="w-3.5 h-3.5 shrink-0 text-primary" />
            )}
            <span className="font-semibold text-foreground/80 truncate uppercase tracking-wider text-[11px]">
              {siteName || domain || 'Web Link'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            {onRemove && !displayImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors ml-1"
                title="Remove preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {cleanTitle || domain || url}
        </h4>

        {cleanDescription && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {cleanDescription}
          </p>
        )}
      </a>
    </div>
  );
};

export default LinkPreviewCard;
