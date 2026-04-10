import { useState } from 'react';
import { exportPng, exportTiff } from '../lib/export';

interface Props {
  imageData: ImageData | null;
  dpi: number;
  lpi: number;
  frameCount: number;
}

export default function ExportButtons({ imageData, dpi, lpi, frameCount }: Props) {
  const [exporting, setExporting] = useState<'png' | 'tiff' | null>(null);

  const handleExport = async (format: 'png' | 'tiff') => {
    if (!imageData) return;
    setExporting(format);
    try {
      if (format === 'png') {
        await exportPng(imageData, dpi, lpi, frameCount);
      } else {
        await exportTiff(imageData, dpi, lpi, frameCount);
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:max-w-md">
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
    </div>
  );
}
