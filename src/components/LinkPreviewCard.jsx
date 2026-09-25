import React, { useState } from 'react';
import { ExternalLink, Play, X, Globe, Eye } from 'lucide-react';
import { FaYoutube, FaGoogleDrive, FaInstagram, FaFacebook } from 'react-icons/fa';

export const LinkPreviewCard = ({ 
  preview, 
  onRemove = null, 
  compact = false,
  className = '' 
}) => {
  const [isPlayingYouTube, setIsPlayingYouTube] = useState(false);
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

              {/* Title overlay */}
              {title && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">
                    {title}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Info Bottom Strip */}
        {!compact && title && (
          <div className="p-3 bg-card border-t border-border/40">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">{title}</h4>
            {author && <p className="text-[11px] text-muted-foreground mt-0.5">By {author}</p>}
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

  // 3. Instagram
  if (mediaType === 'instagram' || url.includes('instagram.com')) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-pink-500/40 ${className}`}>
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 text-pink-600 dark:text-pink-400 font-semibold border border-pink-500/20 shrink-0">
              <FaInstagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </span>
            <span className="font-semibold text-foreground truncate">{title || 'Instagram Post'}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-pink-600 hover:bg-pink-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <span>View on Instagram</span>
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

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 flex items-center justify-between gap-3 group hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <FaInstagram className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate group-hover:text-pink-600 transition-colors">
                {title || 'Instagram Reel / Post'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{url}</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
        </a>
      </div>
    );
  }

  // 4. Facebook
  if (mediaType === 'facebook' || url.includes('facebook.com') || url.includes('fb.watch')) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-blue-600/40 ${className}`}>
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-600 font-semibold border border-blue-600/20 shrink-0">
              <FaFacebook className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </span>
            <span className="font-semibold text-foreground truncate">{title || 'Facebook Content'}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <span>View on Facebook</span>
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

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 flex items-center justify-between gap-3 group hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <FaFacebook className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">
                {title || 'Facebook Post / Video'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{url}</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
        </a>
      </div>
    );
  }

  // 5. Generic Web Link (OpenGraph Card)
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
            alt={title || 'Link preview banner'}
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
          {title || domain || url}
        </h4>

        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </a>
    </div>
  );
};

export default LinkPreviewCard;
