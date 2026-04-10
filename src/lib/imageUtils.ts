export interface LoadedImage {
  id: string;
  name: string;
  element: HTMLImageElement;
  width: number;
  height: number;
  objectUrl: string;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        id: generateId(),
        name: file.name,
        element: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        objectUrl,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = objectUrl;
  });
}

/**
 * Extract ImageData from a loaded image, optionally resizing to target dimensions.
 * Uses center-crop when aspect ratios differ.
 */
export function getImageData(
  image: LoadedImage,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  const srcAspect = image.width / image.height;
  const dstAspect = targetWidth / targetHeight;

  let sx = 0, sy = 0, sw = image.width, sh = image.height;

  if (srcAspect > dstAspect) {
    // Source is wider — crop sides
    sw = image.height * dstAspect;
    sx = (image.width - sw) / 2;
  } else if (srcAspect < dstAspect) {
    // Source is taller — crop top/bottom
    sh = image.width / dstAspect;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image.element, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

export function releaseImage(image: LoadedImage): void {
  URL.revokeObjectURL(image.objectUrl);
}
