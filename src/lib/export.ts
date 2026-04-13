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

const MARGIN_INCHES = 0.3;
const MARK_LEN_INCHES = 0.2;
const MARK_THICKNESS = 1;

/**
 * Wraps interlaced ImageData with a white margin and corner crop marks so
 * the user can precisely cut and align the lenticular sheet. The interlaced
 * content is placed pixel-for-pixel at exact center — no resampling.
 */
export function addCropMarks(src: ImageData, dpi: number): ImageData {
  const margin = Math.round(MARGIN_INCHES * dpi);
  const w = src.width + margin * 2;
  const h = src.height + margin * 2;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const srcCanvas = imageDataToCanvas(src);
  ctx.drawImage(srcCanvas, margin, margin);

  const markLen = Math.round(MARK_LEN_INCHES * dpi);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = MARK_THICKNESS;

  const corners = [
    { x: margin, y: margin },
    { x: margin + src.width, y: margin },
    { x: margin, y: margin + src.height },
    { x: margin + src.width, y: margin + src.height },
  ];

  corners.forEach(({ x, y }, i) => {
    const dx = i % 2 === 0 ? -1 : 1;
    const dy = i < 2 ? -1 : 1;

    ctx.beginPath();
    ctx.moveTo(x + dx * markLen, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * markLen);
    ctx.stroke();
  });

  const mid = Math.round(MARK_LEN_INCHES * dpi * 0.4);
  const centerMarks = [
    { x: margin + src.width / 2, y: margin, dy: -1 },
    { x: margin + src.width / 2, y: margin + src.height, dy: 1 },
    { x: margin, y: margin + src.height / 2, dx: -1 },
    { x: margin + src.width, y: margin + src.height / 2, dx: 1 },
  ];

  centerMarks.forEach(({ x, y, dx, dy }) => {
    ctx.beginPath();
    if (dy) {
      ctx.moveTo(x - mid, y);
      ctx.lineTo(x + mid, y);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + (dy as number) * markLen);
    } else {
      ctx.moveTo(x, y - mid);
      ctx.lineTo(x, y + mid);
      ctx.moveTo(x, y);
      ctx.lineTo(x + (dx as number) * markLen, y);
    }
    ctx.stroke();
  });

  return ctx.getImageData(0, 0, w, h);
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
  flip = false,
  cropMarks = false
): Promise<void> {
  let final = flip ? flipImageDataHorizontal(imageData) : imageData;
  if (cropMarks) final = addCropMarks(final, dpi);
  const canvas = imageDataToCanvas(final);

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
  flip = false,
  cropMarks = false
): Promise<void> {
  let processed = flip ? flipImageDataHorizontal(imageData) : imageData;
  if (cropMarks) processed = addCropMarks(processed, dpi);
  const { width, height, data } = processed;

  // t282/t283 = XResolution/YResolution, t296 = ResolutionUnit (2 = inch)
  const tiffBuffer = UTIF.encodeImage(data.buffer, width, height, {
    t282: [dpi],
    t283: [dpi],
    t296: [2],
  });

  const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
  triggerDownload(blob, buildFilename(lpi, dpi, frameCount, 'tiff'));
}
