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

export default router;
