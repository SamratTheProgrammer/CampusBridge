import React from 'react';
import AutoPlayVideo from './AutoPlayVideo';

const optimizeUrl = (url) => {
  if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
  }
  return url;
};

const FeedMediaGrid = ({ mediaFiles, imageUrl, mediaType, onImageClick, onContainerClick }) => {
  const files = mediaFiles?.length > 0 ? mediaFiles : (imageUrl ? [{ url: imageUrl, mediaType: mediaType }] : []);
  if (files.length === 0) return null;

  // Render a single media item
  const MediaItem = ({ file, isMain }) => {
    const isVideo = file.mediaType === 'video' || (file.url && file.url.match(/\.(mp4|webm|ogg)$/i));
    return isVideo ? (
      <div 
        className="w-full h-full relative" 
        onClick={(e) => {
          if (onContainerClick) onContainerClick();
        }}
      >
        <AutoPlayVideo src={file.url} className={`w-full h-full ${isMain ? 'object-contain' : 'object-cover'}`} />
      </div>
    ) : (
      <img 
        src={optimizeUrl(file.url)} 
        alt="Post content" 
        className={`w-full h-full cursor-pointer ${isMain ? 'object-contain bg-black' : 'object-cover'}`}
        onClick={(e) => {
          if (isMain && onImageClick) {
            e.stopPropagation();
            onImageClick(file.url);
          } else if (onContainerClick) {
            e.stopPropagation();
            onContainerClick();
          }
        }}
      />
    );
  };

  if (files.length === 1) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] bg-black overflow-hidden flex items-center justify-center relative cursor-pointer">
        <MediaItem file={files[0]} isMain={true} />
      </div>
    );
  }

  if (files.length === 2) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] bg-black grid grid-cols-2 gap-1 cursor-pointer" onClick={onContainerClick}>
        {files.slice(0, 2).map((file, idx) => (
          <div key={idx} className="relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900">
             <MediaItem file={file} isMain={false} />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 3) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] bg-black grid grid-cols-2 gap-1 cursor-pointer" onClick={onContainerClick}>
        <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900">
           <MediaItem file={files[0]} isMain={false} />
        </div>
        <div className="grid grid-rows-2 gap-1 h-full w-full">
           <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900"><MediaItem file={files[1]} isMain={false} /></div>
           <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900"><MediaItem file={files[2]} isMain={false} /></div>
        </div>
      </div>
    );
  }

  if (files.length >= 4) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] bg-black grid grid-cols-2 grid-rows-2 gap-1 cursor-pointer" onClick={onContainerClick}>
        {files.slice(0, 4).map((file, idx) => (
          <div key={idx} className="relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-900">
             <MediaItem file={file} isMain={false} />
             {idx === 3 && files.length > 4 && (
               <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-3xl font-bold backdrop-blur-sm">
                 +{files.length - 4}
               </div>
             )}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default FeedMediaGrid;
