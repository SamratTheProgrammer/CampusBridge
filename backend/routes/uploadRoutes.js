import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Adjust if needed

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

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/resume', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Use upload_stream with resource_type 'raw' to avoid PDF 401 security restrictions
    const fileExtension = req.file.originalname.split('.').pop();
    
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

    // End the stream with the file buffer
    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Upload route error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileExtension = req.file.originalname.split('.').pop();
    
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

router.post('/file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileExtension = req.file.originalname.split('.').pop();
    const type = req.body.type || 'auto'; // allow passing resource_type

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: type, // 'raw' for documents, 'auto' for images/videos
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

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch PDF from URL ${url}: ${response.statusText}`);
      return res.status(response.status).json({ message: 'Failed to fetch PDF document' });
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

export default router;
