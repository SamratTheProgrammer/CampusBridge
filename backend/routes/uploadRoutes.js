import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const router = express.Router();

// Explicitly parse Cloudinary URL to avoid any config issues
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (cloudinaryUrl) {
  const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (match) {
    cloudinary.config({
      api_key: match[1],
      api_secret: match[2],
      cloud_name: match[3],
    });
  }
}

// 100MB file size limit to accommodate high-res media, videos, and large docs
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
const ALLOWED_RESUME_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf'
];

const ALLOWED_DOC_EXTENSIONS = [
  ...ALLOWED_RESUME_EXTENSIONS,
  'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'json', 'md', 'zip', 'rar', '7z', 'tar', 'gz'
];

const sanitizeExtension = (filename) => {
  const ext = (filename || '').split('.').pop() || '';
  return ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin';
};

const isAllowedGeneralFile = (file) => {
  const rawMime = (file.mimetype || '').toLowerCase();
  const baseMime = rawMime.split(';')[0].trim();
  const ext = sanitizeExtension(file.originalname);

  // Accept all images
  if (baseMime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'jfif', 'pjpeg', 'avif', 'heic', 'heif', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)) {
    return true;
  }
  // Accept all videos
  if (baseMime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg', '3gp', '3gpp', 'm4v', 'wmv', 'flv', 'ts', 'mpg', 'mpeg'].includes(ext)) {
    return true;
  }
  // Accept all audio
  if (baseMime.startsWith('audio/') || ['mp3', 'wav', 'wave', 'ogg', 'webm', 'm4a', 'aac', 'flac', 'opus', 'wma'].includes(ext)) {
    return true;
  }
  // Accept documents & archives
  if (
    ALLOWED_DOC_EXTENSIONS.includes(ext) ||
    baseMime.includes('pdf') ||
    baseMime.includes('document') ||
    baseMime.includes('word') ||
    baseMime.includes('sheet') ||
    baseMime.includes('presentation') ||
    baseMime.includes('zip') ||
    baseMime.includes('tar') ||
    baseMime.includes('text') ||
    baseMime.includes('application/octet-stream')
  ) {
    return true;
  }

  return false;
};

const isAllowedResumeFile = (file) => {
  const rawMime = (file.mimetype || '').toLowerCase();
  const baseMime = rawMime.split(';')[0].trim();
  const ext = sanitizeExtension(file.originalname);

  return ALLOWED_RESUME_MIMES.includes(baseMime) || ALLOWED_RESUME_EXTENSIONS.includes(ext);
};

const createMulter = (checkFn) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!checkFn(file)) {
        return cb(new Error(`Invalid file type (${file.mimetype || 'unrecognized'}). Please upload a supported file.`));
      }
      cb(null, true);
    }
  });
};

const uploadResume = createMulter(isAllowedResumeFile);
const uploadImage = createMulter(isAllowedGeneralFile); // Supports all post media (images, videos, audio, docs)
const uploadGeneral = createMulter(isAllowedGeneralFile);

router.post('/resume', uploadResume.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileExtension = sanitizeExtension(req.file.originalname);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'campusbridge_resumes',
        public_id: `resume_${Date.now()}.${fileExtension}`
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
        }
        return res.status(200).json({ success: true, url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload route error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/image', uploadImage.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileExtension = sanitizeExtension(req.file.originalname);
    const mime = (req.file.mimetype || '').toLowerCase();
    const isDoc = mime.includes('pdf') || mime.includes('document') || mime.includes('msword') || mime.includes('sheet') || mime.includes('presentation') || mime.includes('text') || ALLOWED_DOC_EXTENSIONS.includes(fileExtension);
    const isVid = mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileExtension);
    
    const resourceType = isDoc ? 'raw' : (isVid ? 'video' : 'auto');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'campusbridge_posts',
        public_id: isDoc ? `post_${Date.now()}.${fileExtension}` : `post_${Date.now()}`
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
        }
        return res.status(200).json({ success: true, url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload route error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/file', uploadGeneral.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileExtension = sanitizeExtension(req.file.originalname);
    const mime = (req.file.mimetype || '').toLowerCase();
    const requestedType = req.body.type || 'auto';
    
    // Accurately determine Cloudinary resource_type
    const isDoc = requestedType === 'raw' || 
                  mime.includes('pdf') || 
                  mime.includes('document') || 
                  mime.includes('msword') || 
                  mime.includes('sheet') || 
                  mime.includes('presentation') || 
                  mime.includes('zip') || 
                  mime.includes('rar') || 
                  mime.includes('tar') || 
                  mime.includes('7z') || 
                  mime.includes('text') || 
                  ALLOWED_DOC_EXTENSIONS.includes(fileExtension);

    let resourceType = 'auto';
    if (requestedType === 'raw' || isDoc) {
      resourceType = 'raw';
    } else if (mime.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(fileExtension)) {
      resourceType = 'video';
    } else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm'].includes(fileExtension)) {
      resourceType = 'video'; // Cloudinary categorizes audio under video resource_type
    } else if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg'].includes(fileExtension)) {
      resourceType = 'image';
    }

    const isRaw = resourceType === 'raw';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'campusbridge_chat',
        public_id: isRaw ? `file_${Date.now()}.${fileExtension}` : `file_${Date.now()}`
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
        }
        return res.status(200).json({ 
          success: true, 
          url: result.secure_url,
          name: req.file.originalname,
          size: req.file.size
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload route error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PDF Proxy endpoint to safely stream Cloudinary PDFs directly with proper application/pdf headers
router.get('/pdf-proxy', async (req, res) => {
  try {
    const { url, download } = req.query;
    if (!url) {
      return res.status(400).json({ message: 'URL query parameter is required' });
    }

    // SSRF Protection: Validate that URL points strictly to Cloudinary domains
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    const isAllowedHost = parsedUrl.hostname.endsWith('cloudinary.com') || parsedUrl.hostname === 'res.cloudinary.com';
    if (!isAllowedHost) {
      return res.status(403).json({ message: 'Access denied: Only Cloudinary document URLs can be proxied' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*'
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch PDF from URL ${url}: ${response.status} ${response.statusText}`);
      const errBody = await response.text().catch(() => '');
      console.error('Cloudinary error response:', errBody);
      return res.status(response.status).json({ message: `Failed to fetch PDF document: ${response.status} ${response.statusText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const disposition = download === 'true' ? 'attachment; filename="document.pdf"' : 'inline; filename="document.pdf"';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error('PDF proxy streaming error:', error);
    return res.status(500).json({ message: 'Error streaming PDF document' });
  }
});

// Multer error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size exceeds 100MB limit' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message || 'File upload rejected' });
  }
  next();
});

export default router;
