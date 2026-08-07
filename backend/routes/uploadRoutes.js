import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Adjust if needed

const router = express.Router();

// Cloudinary connection configuration
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Convert buffer to base64 for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'campusbridge_resumes',
    });

    return res.status(200).json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});

export default router;
