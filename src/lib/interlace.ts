export interface InterlaceParams {
  images: ImageData[];
  lpi: number;
  dpi: number;
}

export interface InterlaceResult {
  imageData: ImageData;
  width: number;
  height: number;
  stripWidth: number;
  lensPitch: number;
}

/**
 * Interlace N source images into a single lenticular-ready output.
 *
 * For each output pixel column, we compute which source image "owns" it
 * based on its position within the repeating lens cycle. This naturally
 * handles fractional strip widths without accumulating rounding error.
 */
export function interlace({ images, lpi, dpi }: InterlaceParams): InterlaceResult {
  const n = images.length;
  if (n < 2) throw new Error('Need at least 2 images');

  const width = images[0].width;
  const height = images[0].height;

  const lensPitch = dpi / lpi;
  const stripWidth = lensPitch / n;

  const output = new ImageData(width, height);
  const outData = output.data;

  // Pre-extract source data arrays for faster access
  const srcArrays = images.map((img) => img.data);

  for (let x = 0; x < width; x++) {
    const phase = (x % lensPitch) / stripWidth;
    const imgIdx = Math.min(Math.floor(phase), n - 1);
    const src = srcArrays[imgIdx];

    // Copy entire column from the selected source image
    for (let y = 0; y < height; y++) {
      const pixelOffset = (y * width + x) * 4;
      outData[pixelOffset] = src[pixelOffset];
      outData[pixelOffset + 1] = src[pixelOffset + 1];
      outData[pixelOffset + 2] = src[pixelOffset + 2];
      outData[pixelOffset + 3] = src[pixelOffset + 3];
    }
  }

  return { imageData: output, width, height, stripWidth, lensPitch };
}
