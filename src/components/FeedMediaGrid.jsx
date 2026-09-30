import React from 'react';
import AutoPlayVideo from './AutoPlayVideo';
import LinkPreviewCard from './LinkPreviewCard';
import PinchZoomMedia from './common/PinchZoomMedia';
import { 
  isYouTubeUrl, 
  isGoogleDriveUrl, 
  isInstagramUrl, 
  isFacebookUrl,
  isReelUrl,
  getInstantUrlPreview 
} from '../utils/linkDetector';

const optimizeUrl = (url) => {
  if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
  }
  return url;
};

const isRichLinkItem = (file) => {
  if (!file || !file.url) return false;
  if (['youtube', 'drive', 'instagram', 'facebook', 'reel', 'link'].includes(file.mediaType)) return true;
  if (isYouTubeUrl(file.url) || isGoogleDriveUrl(file.url) || isInstagramUrl(file.url) || isFacebookUrl(file.url) || isReelUrl(file.url)) {
    return true;
  }
  return false;
};

const FeedMediaGrid = ({ 
  mediaFiles, 
  imageUrl, 
  mediaType, 
  linkPreview, 
  onImageClick, 
  onContainerClick 
}) => {
  const rawFiles = mediaFiles?.length > 0 ? mediaFiles : (imageUrl ? [{ url: imageUrl, mediaType: mediaType }] : []);
  
  // Filter out standalone audio items handled separately
  const validFiles = rawFiles.filter(f => f && f.mediaType !== 'audio' && !f.url?.match(/\.(mp3|wav|ogg|m4a|aac)$/i));

  const richLinkItems = validFiles.filter(isRichLinkItem);
  const standardMediaFiles = validFiles.filter(f => !isRichLinkItem(f));

  // Determine if we have any link preview to show
  const activeLinkPreview = linkPreview || (richLinkItems.length > 0 ? (richLinkItems[0].title ? richLinkItems[0] : getInstantUrlPreview(richLinkItems[0].url)) : null);

  // If there's no visual media and no link preview, return null
  if (standardMediaFiles.length === 0 && !activeLinkPreview) return null;

  // Render a single media item (Image or Video) with Instagram-style pinch-to-zoom
  const MediaItem = ({ file, idx, isMain }) => {
    const isVideo = file.mediaType === 'video' || (file.url && file.url.match(/\.(mp4|webm|ogg)$/i));

    const handleTap = (e) => {
      e?.stopPropagation?.();
      if (onImageClick) {
        onImageClick(standardMediaFiles, idx);
      } else if (onContainerClick) {
        onContainerClick();
      }
    };

    return (
      <PinchZoomMedia 
        onTap={handleTap} 
        className={isMain ? "w-full max-h-[580px] flex items-center justify-center" : "w-full h-full flex items-center justify-center"}
      >
        {isVideo ? (
          <div className={`relative cursor-pointer ${isMain ? 'w-fit max-w-full max-h-[580px] flex items-center justify-center' : 'w-full h-full'}`}>
            <AutoPlayVideo src={file.url} className={isMain ? 'w-auto max-w-full max-h-[580px] object-contain' : 'w-full h-full object-cover'} />
          </div>
        ) : (
          <img 
            src={optimizeUrl(file.url)} 
            alt="Post content" 
            className={`cursor-pointer ${isMain ? 'w-auto max-w-full max-h-[580px] object-contain mx-auto' : 'w-full h-full object-cover'}`}
          />
        )}
      </PinchZoomMedia>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Standard Image & Video Grid */}
      {standardMediaFiles.length === 1 && (
        <div className="w-full max-h-[580px] bg-black/90 dark:bg-black overflow-hidden flex items-center justify-center relative rounded-2xl">
          <MediaItem file={standardMediaFiles[0]} idx={0} isMain={true} />
        </div>
      )}

      {standardMediaFiles.length === 2 && (
        <div className="w-full h-[400px] sm:h-[500px] bg-black grid grid-cols-2 gap-1" onClick={onContainerClick}>
          {standardMediaFiles.slice(0, 2).map((file, idx) => (
            <div key={idx} className="relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900">
              <MediaItem file={file} idx={idx} isMain={false} />
            </div>
          ))}
        </div>
      )}

      {standardMediaFiles.length === 3 && (
        <div className="w-full h-[400px] sm:h-[500px] bg-black grid grid-cols-2 gap-1" onClick={onContainerClick}>
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900">
            <MediaItem file={standardMediaFiles[0]} idx={0} isMain={false} />
          </div>
          <div className="grid grid-rows-2 gap-1 h-full w-full">
            <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900"><MediaItem file={standardMediaFiles[1]} idx={1} isMain={false} /></div>
            <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900"><MediaItem file={standardMediaFiles[2]} idx={2} isMain={false} /></div>
          </div>
        </div>
      )}

      {standardMediaFiles.length >= 4 && (
        <div className="w-full h-[400px] sm:h-[500px] bg-black grid grid-cols-2 grid-rows-2 gap-1" onClick={onContainerClick}>
          {standardMediaFiles.slice(0, 4).map((file, idx) => (
            <div key={idx} className="relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900">
              <MediaItem file={file} idx={idx} isMain={false} />
              {idx === 3 && standardMediaFiles.length > 4 && (
                <div 
                  className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-3xl font-bold backdrop-blur-sm cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onImageClick) {
                      onImageClick(standardMediaFiles, 3);
                    } else if (onContainerClick) {
                      onContainerClick();
                    }
                  }}
                >
                  +{standardMediaFiles.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rich Link / Media Preview Card (YouTube, Drive, Instagram, Facebook, Web) */}
      {activeLinkPreview && (
        <div className="px-4 sm:px-5 pb-1">
          <LinkPreviewCard preview={activeLinkPreview} />
        </div>
      )}
    </div>
  );
};

export default FeedMediaGrid;
