import { useCallback, useState } from 'react';
import ImageUploader from './components/ImageUploader';
import SettingsPanel from './components/SettingsPanel';
import InterlacePreview from './components/InterlacePreview';
import ExportButtons from './components/ExportButtons';
import type { LoadedImage } from './lib/imageUtils';
import { getImageData } from './lib/imageUtils';
import { interlace } from './lib/interlace';

export default function App() {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [lpi, setLpi] = useState(40);
  const [dpi, setDpi] = useState(600);
  const [result, setResult] = useState<{
    imageData: ImageData;
    stripWidth: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const targetWidth = images.length > 0 ? images[0].width : null;
  const targetHeight = images.length > 0 ? images[0].height : null;
  const canGenerate = images.length >= 2;

  const handleGenerate = useCallback(() => {
    if (!canGenerate || !targetWidth || !targetHeight) return;

    setProcessing(true);
    requestAnimationFrame(() => {
      try {
        const imageDatas = images.map((img) =>
          getImageData(img, targetWidth, targetHeight)
        );
        const r = interlace({ images: imageDatas, lpi, dpi });
        setResult({ imageData: r.imageData, stripWidth: r.stripWidth });
      } catch (e) {
        console.error('Interlace error:', e);
        setResult(null);
      } finally {
        setProcessing(false);
      }
    });
  }, [canGenerate, images, targetWidth, targetHeight, lpi, dpi]);

  const handleImagesChange = useCallback((newImages: LoadedImage[]) => {
    setImages(newImages);
    setResult(null);
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-text-primary">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b border-border shrink-0">
        <h1 className="text-base sm:text-lg font-semibold tracking-tight">
          Lenticular Print Generator
        </h1>
      </header>

      {/* Controls */}
      <section className="px-4 sm:px-6 py-4 border-b border-border space-y-4 shrink-0">
        <ImageUploader images={images} onImagesChange={handleImagesChange} />

        <div className="flex flex-wrap items-end gap-3">
          <SettingsPanel
            lpi={lpi}
            dpi={dpi}
            frameCount={images.length}
            imageWidth={targetWidth}
            imageHeight={targetHeight}
            onLpiChange={setLpi}
            onDpiChange={setDpi}
          />
          <button
            disabled={!canGenerate || processing}
            onClick={handleGenerate}
            className="h-10 px-6 rounded-lg font-medium text-sm w-full sm:w-auto
              whitespace-nowrap transition-colors duration-150
              bg-accent text-white hover:bg-accent-hover
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent"
          >
            {processing ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </section>

      {/* Preview + Export */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
        <InterlacePreview
          imageData={result?.imageData ?? null}
          stripWidth={result?.stripWidth ?? 0}
          frameCount={images.length}
        />

        {result && (
          <div className="pt-4 shrink-0">
            <ExportButtons
              imageData={result.imageData}
              dpi={dpi}
              lpi={lpi}
              frameCount={images.length}
            />
          </div>
        )}
      </main>
    </div>
  );
}
