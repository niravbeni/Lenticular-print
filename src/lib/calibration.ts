import { changeDpiBlob } from 'changedpi';

const LPI_STEP = 0.05;
const HALF_RANGE = 0.30;
const BAND_HEIGHT_INCHES = 0.35;
const LABEL_HEIGHT = 20;

function buildOffsets(): number[] {
  const offsets: number[] = [];
  for (let d = -HALF_RANGE; d <= HALF_RANGE + 1e-9; d += LPI_STEP) {
    offsets.push(Math.round(d * 100) / 100);
  }
  return offsets;
}

/**
 * Generates a calibration strip with alternating black/white bands at fine
 * LPI variations (0.05 LPI steps, ±0.30 LPI around center). Print at actual
 * size and hold your lenticular sheet over it — the band that appears as a
 * solid color (all black or all white) reveals your true effective LPI.
 */
export function generateCalibrationStrip(
  dpi: number,
  lpi: number,
  printWidthInches: number
): ImageData {
  const offsets = buildOffsets();
  const width = Math.round(printWidthInches * dpi);
  const bandPx = Math.round(BAND_HEIGHT_INCHES * dpi);
  const totalHeight = offsets.length * (bandPx + LABEL_HEIGHT);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  offsets.forEach((delta, i) => {
    const adjustedLpi = lpi + delta;
    const pitch = dpi / adjustedLpi;
    const yStart = i * (bandPx + LABEL_HEIGHT);

    const isCenter = delta === 0;
    ctx.fillStyle = isCenter ? '#0044cc' : '#1a1d27';
    ctx.font = `bold ${Math.min(14, LABEL_HEIGHT - 4)}px monospace`;
    ctx.textBaseline = 'top';
    const sign = delta >= 0 ? '+' : '';
    const label = `${adjustedLpi.toFixed(2)} LPI (${sign}${delta.toFixed(2)})${isCenter ? '  ◀ base' : ''}`;
    ctx.fillText(label, 4, yStart + 2);

    const bandTop = yStart + LABEL_HEIGHT;
    for (let x = 0; x < width; x++) {
      const phase = (x % pitch) / pitch;
      if (phase < 0.5) {
        ctx.fillStyle = '#000000';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(x, bandTop, 1, bandPx);
    }
  });

  return ctx.getImageData(0, 0, width, totalHeight);
}

export async function exportCalibrationPng(
  dpi: number,
  lpi: number,
  printWidthInches: number
): Promise<void> {
  const imageData = generateCalibrationStrip(dpi, lpi, printWidthInches);

  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create calibration PNG'));
    }, 'image/png');
  });

  const dpiBlob = await changeDpiBlob(blob, dpi);

  const url = URL.createObjectURL(dpiBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calibration_${lpi}lpi_${dpi}dpi.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
