import { Router, Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';

const router = Router();

// Configure multer with memory storage (up to 100MB video file size for free tier)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/**
 * 1. POST /api/upload/video
 * Uploads a video file directly to Cloudinary and returns CDN streaming URL and duration
 */
router.post('/video', upload.single('video'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'Please select a video file to upload' });
      return;
    }

    const folder = (req.body.folder || 'binary_vidya/lectures').toString();

    // Stream upload directly from memory buffer to Cloudinary Video CDN
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder,
        chunk_size: 6000000, // 6MB chunks for robust streaming upload
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }, // Automatic bitrate & codec optimization
        ],
      },
      (error, result) => {
        if (error || !result) {
          console.error('[Cloudinary Video Upload Error]:', error);
          res.status(500).json({
            success: false,
            message: error?.message || 'Failed to upload video to Cloudinary',
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: 'Video uploaded successfully',
          videoUrl: result.secure_url,
          duration: result.duration || 0,
          format: result.format,
          publicId: result.public_id,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(file.buffer);
  } catch (error: any) {
    console.error('[Upload Video Route Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during video upload' });
  }
});

/**
 * 2. POST /api/upload/image
 * Uploads course thumbnails, lecture previews, or badges
 */
router.post('/image', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'Please select an image file to upload' });
      return;
    }

    const folder = (req.body.folder || 'binary_vidya/thumbnails').toString();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          console.error('[Cloudinary Image Upload Error]:', error);
          res.status(500).json({
            success: false,
            message: error?.message || 'Failed to upload image to Cloudinary',
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: 'Image uploaded successfully',
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(file.buffer);
  } catch (error: any) {
    console.error('[Upload Image Route Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during image upload' });
  }
});

/**
 * 3. POST /api/upload/sign
 * Generates an authorized signature for direct frontend-to-Cloudinary upload.
 * Extremely fast: client sends video directly to Cloudinary without overloading backend server!
 */
router.post('/sign', async (req: Request, res: Response): Promise<void> => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.body.folder || 'binary_vidya/lectures';

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET || 'v3V44AtCU0JlB-TwyEsAl_fL1gE'
    );

    res.status(200).json({
      success: true,
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dcqgca3p4',
      apiKey: process.env.CLOUDINARY_API_KEY || '859622467181683',
      folder,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate signature' });
  }
});

export default router;
