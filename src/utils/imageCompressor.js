/**
 * WhatsApp-style smart client-side image compression:
 * - Downscales ultra-high-resolution images (max 1920x1920 preserving aspect ratio)
 * - Encodes as clean, vibrant JPEG with ~0.83 quality
 * - Strips bulky EXIF metadata while maintaining sharpness
 * - Reduces 5MB-25MB phone camera images down to ~150KB-400KB in milliseconds
 * - Skips animated GIFs, SVGs, and already small images (< 500KB)
 */
export async function compressImageWhatsAppStyle(file, maxDimension = 1920, quality = 0.83) {
  if (!file) return file;

  // Preserve non-image files, animated GIFs, and vector SVGs
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (
    !mime.startsWith('image/') ||
    mime === 'image/gif' ||
    mime === 'image/svg+xml' ||
    name.endsWith('.gif') ||
    name.endsWith('.svg')
  ) {
    return file;
  }

  // If already under 500KB, no aggressive compression needed
  if (file.size <= 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    // Timeout safeguard: if image loading hangs, fallback to original file
    const timeoutId = setTimeout(() => {
      resolve(file);
    }, 4000);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          let width = img.width;
          let height = img.height;

          // Downscale if either dimension exceeds maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(file);
            return;
          }

          // Smooth interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                const compressedFile = new File([blob], `${baseName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                // If compression didn't save size, use original
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          console.warn('[imageCompressor] Falling back to original file:', err);
          resolve(file);
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(file);
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      clearTimeout(timeoutId);
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

export default compressImageWhatsAppStyle;
