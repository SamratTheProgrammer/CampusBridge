import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import AutoPlayVideo from './AutoPlayVideo';

const optimizeUrl = (url) => {
  if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_1200/');
  }
  return url;
};

const ImageViewerModal = ({ isOpen, mediaFiles = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Normalize mediaFiles to array of objects
  const files = React.useMemo(() => {
    if (!mediaFiles) return [];
    if (typeof mediaFiles === 'string') return [{ url: mediaFiles, mediaType: 'image' }];
    return mediaFiles.map(file => {
      if (typeof file === 'string') return { url: file, mediaType: 'image' };
      return file;
    });
  }, [mediaFiles]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < files.length - 1) setCurrentIndex(prev => prev + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, files.length, onClose]);

  if (!isOpen || files.length === 0) return null;

  const activeMedia = files[currentIndex];
  const isVideo = activeMedia?.mediaType === 'video' || (activeMedia?.url && activeMedia.url.match(/\.(mp4|webm|ogg)$/i));

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-sm cursor-zoom-out"
          onClick={onClose}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo ? (
              <AutoPlayVideo 
                src={activeMedia.url} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" 
              />
            ) : (
              <motion.img 
                key={activeMedia.url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={optimizeUrl(activeMedia.url)} 
                alt="Full view" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
              />
            )}

            {/* Navigation Buttons */}
            {files.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev - 1); }}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-20"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                )}
                
                {currentIndex < files.length - 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev + 1); }}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-20"
                  >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                )}

                {/* Dots indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {files.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-white/50 cursor-pointer hover:bg-white/80'}`}
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImageViewerModal;
