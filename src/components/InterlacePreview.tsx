import { useEffect, useRef, useState } from 'react';

interface Props {
  imageData: ImageData | null;
  stripWidth: number;
  frameCount: number;
}

export default function InterlacePreview({
  imageData,
  stripWidth,
  frameCount,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!imageData || !containerRef.current) return;
    const container = containerRef.current;

    const recalc = () => {
      const pad = 16;
      const hScale = (container.clientWidth - pad) / imageData.width;
      const vScale = (container.clientHeight - pad) / imageData.height;
      setFitScale(Math.min(hScale, vScale, 1));
    };
    recalc();

    const ro = new ResizeObserver(recalc);
    ro.observe(container);
    return () => ro.disconnect();
  }, [imageData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    if (showOverlay && stripWidth > 0) {
      const colors = [
        'rgba(108,140,255,0.25)',
        'rgba(240,160,64,0.25)',
        'rgba(74,222,128,0.25)',
        'rgba(248,113,113,0.25)',
        'rgba(168,85,247,0.25)',
        'rgba(56,189,248,0.25)',
      ];
      const lensPitch = stripWidth * frameCount;

      for (let x = 0; x < imageData.width; x++) {
        const phase = (x % lensPitch) / stripWidth;
        const imgIdx = Math.min(Math.floor(phase), frameCount - 1);
        ctx.fillStyle = colors[imgIdx % colors.length];
        ctx.fillRect(x, 0, 1, imageData.height);
      }
    }
  }, [imageData, showOverlay, stripWidth, frameCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageData) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) =>
        Math.min(Math.max(z + (e.deltaY > 0 ? -0.1 : 0.1), 0.1), 10)
      );
    };
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, [imageData]);

  if (!imageData) {
    return (
      <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-text-tertiary text-sm text-center px-4">
          Upload at least 2 images, set LPI & DPI, then hit Generate
        </p>
      </div>
    );
  }

  const displayScale = fitScale * zoom;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
        <span className="text-xs text-text-tertiary font-mono">
          {imageData.width}&times;{imageData.height}
        </span>

        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOverlay}
            onChange={(e) => setShowOverlay(e.target.checked)}
            className="accent-accent"
          />
          Strips
        </label>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.1))}
            className="w-7 h-7 flex items-center justify-center text-sm rounded
              border border-border hover:border-border-bright text-text-secondary"
          >
            &minus;
          </button>
          <span className="text-xs text-text-tertiary font-mono w-12 text-center">
            {Math.round(displayScale * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 10))}
            className="w-7 h-7 flex items-center justify-center text-sm rounded
              border border-border hover:border-border-bright text-text-secondary"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="h-7 px-2 text-xs rounded border border-border
              hover:border-border-bright text-text-secondary ml-1"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-xl border border-border bg-surface-overlay
          flex items-center justify-center min-h-0"
      >
        <canvas
          ref={canvasRef}
          style={{
            width: imageData.width * displayScale,
            height: imageData.height * displayScale,
            imageRendering: displayScale > 2 ? 'pixelated' : 'auto',
          }}
          className="block"
        />
      </div>
    </div>
  );
}
