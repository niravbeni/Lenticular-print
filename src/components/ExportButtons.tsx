import { useState } from 'react';
import { exportPng, exportTiff } from '../lib/export';
import { exportCalibrationPng } from '../lib/calibration';

interface Props {
  imageData: ImageData | null;
  dpi: number;
  lpi: number;
  frameCount: number;
  printWidth: number;
  flipForPrint: boolean;
  onFlipChange: (v: boolean) => void;
}

export default function ExportButtons({
  imageData,
  dpi,
  lpi,
  frameCount,
  printWidth,
  flipForPrint,
  onFlipChange,
}: Props) {
  const [exporting, setExporting] = useState<'png' | 'tiff' | 'cal' | null>(null);

  const handleExport = async (format: 'png' | 'tiff') => {
    if (!imageData) return;
    setExporting(format);
    try {
      if (format === 'png') {
        await exportPng(imageData, dpi, lpi, frameCount, flipForPrint);
      } else {
        await exportTiff(imageData, dpi, lpi, frameCount, flipForPrint);
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  const [showTips, setShowTips] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => handleExport('png')}
            className="h-10 px-5 rounded-lg font-medium text-sm
              transition-colors duration-150
              bg-accent text-white hover:bg-accent-hover"
          >
            {exporting === 'png' ? 'Exporting...' : 'Download PNG'}
          </button>
          <button
            onClick={() => handleExport('tiff')}
            className="h-10 px-5 rounded-lg font-medium text-sm
              transition-colors duration-150
              border border-border text-text-secondary hover:border-border-bright hover:text-text-primary"
          >
            {exporting === 'tiff' ? 'Exporting...' : 'Download TIFF'}
          </button>
          <button
            onClick={async () => {
              setExporting('cal');
              try {
                await exportCalibrationPng(dpi, lpi, printWidth);
              } catch (e) {
                console.error('Calibration export failed:', e);
              } finally {
                setExporting(null);
              }
            }}
            className="h-10 px-5 rounded-lg font-medium text-sm
              transition-colors duration-150
              border border-border text-text-secondary hover:border-border-bright hover:text-text-primary"
          >
            {exporting === 'cal' ? 'Exporting...' : 'Calibration Strip'}
          </button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={flipForPrint}
            onChange={(e) => onFlipChange(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-accent"
          />
          <span className="text-sm text-text-secondary">
            Mirror for back-printing
          </span>
        </label>
      </div>

      <button
        onClick={() => setShowTips((v) => !v)}
        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
      >
        <span className={`inline-block transition-transform ${showTips ? 'rotate-90' : ''}`}>
          &#9654;
        </span>
        Printing Tips
      </button>

      {showTips && (
        <ul className="text-xs text-text-tertiary space-y-1.5 pl-4 list-disc">
          <li>
            <strong>Print at actual size</strong> &mdash; disable any "fit to
            page" or "scale" option in your printer dialog so strips align with
            lenses.
          </li>
          <li>
            <strong>Use highest quality</strong> &mdash; select the best print
            quality / highest resolution mode your printer supports.
          </li>
          <li>
            <strong>Print on the flat (back) side</strong> of the lenticular
            sheet, not the ridged side.
          </li>
          <li>
            <strong>Align vertically</strong> &mdash; the lens ridges must run
            exactly vertical, parallel to the strip direction.
          </li>
          <li>
            <strong>Calibrate first</strong> &mdash; download the calibration
            strip, print it, and hold your lenticular sheet over it. The band
            that shows a solid colour (all black or all white) reveals your
            true effective LPI for this printer.
          </li>
          <li>
            <strong>Mirror is on by default</strong> &mdash; the exported image
            is horizontally flipped so it looks correct when viewed through the
            lens side. Disable the checkbox only if printing directly onto the
            front (unusual).
          </li>
        </ul>
      )}
    </div>
  );
}
