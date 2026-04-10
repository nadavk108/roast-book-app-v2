import type { PixelCrop } from 'react-image-crop';

/**
 * Renders the cropped region of an image onto a canvas and returns a File.
 * crop coordinates are in rendered-image pixels; we scale to natural resolution.
 */
export async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  originalFileName: string
): Promise<File> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas toBlob returned null'));
        return;
      }
      const croppedName = originalFileName.replace(/(\.[^.]+)?$/, '_cropped.jpg');
      resolve(new File([blob], croppedName, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}
