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

// 10MB file size limit
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_RESUME_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/mp4'
];

const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/x-matroska',
  'video/avi',
  'video/mov'
];

const ALLOWED_GENERAL_MIMES = [
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_RESUME_MIMES,
  ...ALLOWED_AUDIO_MIMES,
  ...ALLOWED_VIDEO_MIMES,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const createMulter = (allowedMimes) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
      const rawMime = (file.mimetype || '').toLowerCase();
      const baseMime = rawMime.split(';')[0].trim();
      if (!allowedMimes.includes(rawMime) && !allowedMimes.includes(baseMime)) {
        return cb(new Error(`Invalid file type (${file.mimetype}). Permitted types: ${allowedMimes.join(', ')}`));
      }
      cb(null, true);
    }
  });
};

const uploadResume = createMulter(ALLOWED_RESUME_MIMES);
const uploadImage = createMulter(ALLOWED_GENERAL_MIMES); // Supports all post media (images, videos, audio)
const uploadGeneral = createMulter(ALLOWED_GENERAL_MIMES);

const sanitizeExtension = (filename) => {
  const ext = (filename || '').split('.').pop() || '';
  return ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin';
};

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
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'campusbridge_posts',
        public_id: `post_${Date.now()}.${fileExtension}`
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
    const requestedType = req.body.type || 'auto';
    const allowedTypes = ['auto', 'raw', 'image', 'video'];
    const type = allowedTypes.includes(requestedType) ? requestedType : 'auto';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: type,
        folder: 'campusbridge_chat',
        public_id: `file_${Date.now()}.${fileExtension}`
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
      return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message || 'File upload rejected' });
  }
  next();
});

export default router;
