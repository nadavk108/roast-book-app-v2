export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Renders the cropped region of an image onto a canvas and returns a File.
 * Standard pattern from react-easy-crop docs, adapted to return a File.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  originalFileName: string
): Promise<File> {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob());

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas toBlob returned null'));
        return;
      }
      const ext = originalFileName.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      const croppedName = originalFileName.replace(/(\.[^.]+)?$/, '_cropped.jpg');
      resolve(new File([blob], croppedName, { type: mime }));
    }, 'image/jpeg', 0.92);
  });
}
