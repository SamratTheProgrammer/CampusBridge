import toast from 'react-hot-toast';

/**
 * Downloads a media file (image, video, audio) to the client machine.
 * Uses blob download where possible with fallback to opening direct link.
 * 
 * @param {string} url - URL of the media file
 * @param {string} filename - Suggested filename
 */
export const downloadMediaFile = async (url, filename = 'download') => {
  if (!url) {
    toast.error('No media URL provided for download');
    return;
  }

  const toastId = toast.loading('Preparing download...');
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) throw new Error('Download request failed');

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;

    // Detect extension from mime or url if not present
    let finalFilename = filename;
    if (!finalFilename.includes('.')) {
      const ext = blob.type.split('/')[1]?.split(';')[0] || 'bin';
      finalFilename = `${filename}.${ext}`;
    }

    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    toast.success('Download started!', { id: toastId });
  } catch (err) {
    console.warn('Direct blob download failed, falling back to direct link:', err);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Opening download in new tab...', { id: toastId });
    } catch (fallbackErr) {
      toast.error('Failed to download media file', { id: toastId });
    }
  }
};
