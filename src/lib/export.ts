import { changeDpiBlob } from 'changedpi';
import UTIF from 'utif';

export function flipImageDataHorizontal(src: ImageData): ImageData {
  const { width, height, data } = src;
  const out = new ImageData(width, height);
  const d = out.data;
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const srcIdx = (rowOffset + x) * 4;
      const dstIdx = (rowOffset + (width - 1 - x)) * 4;
      d[dstIdx] = data[srcIdx];
      d[dstIdx + 1] = data[srcIdx + 1];
      d[dstIdx + 2] = data[srcIdx + 2];
      d[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  return out;
}

function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildFilename(
  lpi: number,
  dpi: number,
  frameCount: number,
  ext: string
): string {
  return `lenticular_${lpi}lpi_${dpi}dpi_${frameCount}frames.${ext}`;
}

export async function exportPng(
  imageData: ImageData,
  dpi: number,
  lpi: number,
  frameCount: number,
  flip = false
): Promise<void> {
  const canvas = imageDataToCanvas(flip ? flipImageDataHorizontal(imageData) : imageData);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create PNG blob'));
    }, 'image/png');
  });

  const dpiBlob = await changeDpiBlob(blob, dpi);
  triggerDownload(dpiBlob, buildFilename(lpi, dpi, frameCount, 'png'));
}

export async function exportTiff(
  imageData: ImageData,
  dpi: number,
  lpi: number,
  frameCount: number,
  flip = false
): Promise<void> {
  const final = flip ? flipImageDataHorizontal(imageData) : imageData;
  const { width, height, data } = final;

  // t282/t283 = XResolution/YResolution, t296 = ResolutionUnit (2 = inch)
  const tiffBuffer = UTIF.encodeImage(data.buffer, width, height, {
    t282: [dpi],
    t283: [dpi],
    t296: [2],
  });

  const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
  triggerDownload(blob, buildFilename(lpi, dpi, frameCount, 'tiff'));
}
