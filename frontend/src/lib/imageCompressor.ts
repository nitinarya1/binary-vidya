/**
 * Automatically resizes and compresses image files (course & video thumbnails)
 * using HTML5 Canvas with modern WebP / JPEG compression.
 * Converts multi-MB files down to ultra-lightweight ~30KB-70KB assets for instant page loads.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number; // in bytes
  compressedSize: number; // in bytes
  reductionPercentage: number;
  width: number;
  height: number;
}

export async function compressThumbnail(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<CompressionResult> {
  const { maxWidth = 1280, maxHeight = 720, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Calculate new dimensions preserving aspect ratio (16:9 targeted)
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context could not be acquired'));
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal compression, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate approximate binary size from base64 string
        const base64Content = dataUrl.split(',')[1] || '';
        const compressedSize = Math.round((base64Content.length * 3) / 4);
        const originalSize = file.size;
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSize - compressedSize) / originalSize) * 100)
        );

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          reductionPercentage,
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error('Failed to parse and decode image'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
  });
}

export async function compressAvatar(file: File): Promise<CompressionResult> {
  return compressThumbnail(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

