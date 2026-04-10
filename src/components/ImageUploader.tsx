import { useCallback, useRef, useState } from 'react';
import type { LoadedImage } from '../lib/imageUtils';
import { loadImageFromFile, releaseImage } from '../lib/imageUtils';

interface Props {
  images: LoadedImage[];
  onImagesChange: (images: LoadedImage[]) => void;
}

export default function ImageUploader({ images, onImagesChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length === 0) {
        setError('No valid image files selected');
        return;
      }
      try {
        const loaded = await Promise.all(imageFiles.map(loadImageFromFile));
        onImagesChange([...images, ...loaded]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load images');
      }
    },
    [images, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (img) releaseImage(img);
      onImagesChange(images.filter((i) => i.id !== id));
    },
    [images, onImagesChange]
  );

  const handleReorderDrop = useCallback(
    (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === targetIdx) return;
      const reordered = [...images];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(targetIdx, 0, moved);
      onImagesChange(reordered);
      setDragIdx(null);
    },
    [dragIdx, images, onImagesChange]
  );

  const dimensionWarning =
    images.length >= 2 &&
    images.some(
      (img) =>
        img.width !== images[0].width || img.height !== images[0].height
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg px-4 py-3 text-center cursor-pointer
            transition-colors duration-150 shrink-0
            ${
              dragOver
                ? 'border-accent bg-accent-muted'
                : 'border-border hover:border-border-bright'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <span className="text-sm text-text-tertiary">
            <span className="text-accent font-medium">
              {images.length === 0 ? 'Upload images' : '+ Add'}
            </span>
            {images.length === 0 && (
              <span className="hidden sm:inline"> or drop here</span>
            )}
          </span>
        </div>

        {/* Thumbnails — inline with the drop zone */}
        {images.map((img, idx) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleReorderDrop(e, idx)}
            onDragEnd={() => setDragIdx(null)}
            className={`
              relative group rounded-lg overflow-hidden border shrink-0
              transition-all duration-150 cursor-grab active:cursor-grabbing
              ${dragIdx === idx ? 'opacity-40 border-accent' : 'border-border hover:border-border-bright'}
            `}
          >
            <img
              src={img.objectUrl}
              alt={img.name}
              className="w-14 h-14 sm:w-16 sm:h-16 object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[10px] text-text-secondary px-1 truncate leading-tight py-px">
              {idx + 1}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(img.id);
              }}
              className="absolute top-0 right-0 w-5 h-5 rounded-bl-md bg-black/70
                text-text-secondary hover:text-danger text-xs
                opacity-0 group-hover:opacity-100 transition-opacity
                flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-danger text-xs">{error}</p>}

      {dimensionWarning && (
        <p className="text-xs text-warning">
          Different dimensions — images will be cropped to match.
        </p>
      )}
    </div>
  );
}
