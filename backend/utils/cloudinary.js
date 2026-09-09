import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

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

/**
 * Deletes an asset from Cloudinary using its secure URL.
 * Extracts the public_id including folders.
 * @param {string} url - Full Cloudinary URL
 * @returns {Promise<any>}
 */
export const deleteCloudinaryAsset = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    // Regex extracts path between /upload/(optional v12345/ ) and the final extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (match && match[1]) {
      const publicId = match[1];
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    }
  } catch (err) {
    console.error('Failed to delete asset from Cloudinary:', err);
  }
  return null;
};

export default cloudinary;
