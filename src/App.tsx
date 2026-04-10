import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import ImageUploader from './components/ImageUploader';
import SettingsPanel from './components/SettingsPanel';
import InterlacePreview from './components/InterlacePreview';
import ExportButtons from './components/ExportButtons';
import type { LoadedImage } from './lib/imageUtils';
import { getImageData, loadImageFromUrl } from './lib/imageUtils';
import { interlace } from './lib/interlace';

const LenticularSimulator = lazy(
  () => import('./components/LenticularSimulator')
);

const DEFAULT_IMAGES = [
  { url: '/image-test/pic1.png', name: 'pic1.png' },
  { url: '/image-test/pic2.png', name: 'pic2.png' },
];

export default function App() {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [lpi, setLpi] = useState(40);
  const [dpi, setDpi] = useState(600);
  const [result, setResult] = useState<{
    imageData: ImageData;
    stripWidth: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const generateId = useRef(0);
  const defaultsLoaded = useRef(false);

  useEffect(() => {
    if (defaultsLoaded.current) return;
    defaultsLoaded.current = true;

    Promise.all(
      DEFAULT_IMAGES.map((d) => loadImageFromUrl(d.url, d.name))
    )
      .then((loaded) => setImages(loaded))
      .catch((e) => console.warn('Could not load default images:', e));
  }, []);

  const targetWidth = images.length > 0 ? images[0].width : null;
  const targetHeight = images.length > 0 ? images[0].height : null;
  const canGenerate = images.length >= 2;

  const handleGenerate = useCallback(() => {
    if (!canGenerate || !targetWidth || !targetHeight) return;

    const id = ++generateId.current;
    setProcessing(true);
    setResult(null);

    setTimeout(() => {
      if (id !== generateId.current) return;
      try {
        const imageDatas = images.map((img) =>
          getImageData(img, targetWidth, targetHeight)
        );
        const r = interlace({ images: imageDatas, lpi, dpi });
        setResult({ imageData: r.imageData, stripWidth: r.stripWidth });
      } catch (e) {
        console.error('Interlace error:', e);
      }
      setProcessing(false);
    }, 16);
  }, [canGenerate, images, targetWidth, targetHeight, lpi, dpi]);

  const handleImagesChange = useCallback((newImages: LoadedImage[]) => {
    setImages(newImages);
    setResult(null);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-surface text-text-primary">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b border-border">
        <h1 className="text-base sm:text-lg font-semibold tracking-tight">
          Lenticular Print Generator
        </h1>
      </header>

      {/* Controls */}
      <section className="px-4 sm:px-6 py-4 border-b border-border space-y-3">
        <ImageUploader images={images} onImagesChange={handleImagesChange} />

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
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
            className="h-10 px-6 rounded-lg font-medium text-sm
              whitespace-nowrap transition-colors duration-150
              bg-accent text-white hover:bg-accent-hover
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent"
          >
            {processing ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </section>

      {/* Content area */}
      <main className="p-4 sm:p-6 space-y-4">
        {/* Preview + Simulation: side-by-side on desktop, stacked on mobile */}
        <div className={`flex flex-col gap-4 ${
          result ? 'lg:flex-row lg:h-[min(65vh,600px)]' : ''
        }`}>
          {/* Left: interlaced preview */}
          <div className={`lg:flex-1 ${
            result ? 'h-[35vh] sm:h-[min(50vh,500px)] lg:h-full' : 'h-[35vh] sm:h-[min(50vh,500px)]'
          }`}>
            <InterlacePreview
              imageData={result?.imageData ?? null}
              stripWidth={result?.stripWidth ?? 0}
              frameCount={images.length}
            />
          </div>

          {/* Right: 3D simulation (only when result exists) */}
          {result && (
            <div className="lg:flex-1 lg:h-full">
              <Suspense
                fallback={
                  <div className="h-[280px] sm:h-[400px] lg:h-full rounded-xl border border-border bg-surface-overlay flex items-center justify-center text-text-tertiary text-sm">
                    Loading 3D simulation...
                  </div>
                }
              >
                <LenticularSimulator images={images} lpi={lpi} />
              </Suspense>
            </div>
          )}
        </div>

        {/* Export buttons below */}
        {result && (
          <ExportButtons
            imageData={result.imageData}
            dpi={dpi}
            lpi={lpi}
            frameCount={images.length}
          />
        )}
      </main>
    </div>
  );
}
