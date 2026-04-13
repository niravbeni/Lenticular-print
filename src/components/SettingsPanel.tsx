interface Props {
  lpi: number;
  dpi: number;
  printWidth: number;
  printHeight: number;
  frameCount: number;
  onLpiChange: (v: number) => void;
  onDpiChange: (v: number) => void;
  onPrintWidthChange: (v: number) => void;
  onPrintHeightChange: (v: number) => void;
}

const LPI_PRESETS = [15, 20, 40, 50, 50.24, 60, 75, 100];
const DPI_PRESETS = [300, 600, 720, 1200, 1440];
const SIZE_PRESETS: { label: string; w: number; h: number }[] = [
  { label: '4×6', w: 4, h: 6 },
  { label: '5×7', w: 5, h: 7 },
  { label: '6×8', w: 6, h: 8 },
  { label: '6×9', w: 6, h: 9 },
  { label: '8×10', w: 8, h: 10 },
];

function InlineSelect({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: number;
  presets: number[];
  onChange: (v: number) => void;
}) {
  const isPreset = presets.includes(value);

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs text-text-tertiary">{label}</label>
      <div className="flex gap-1.5">
        <select
          value={isPreset ? value : 'custom'}
          onChange={(e) => {
            const v = e.target.value;
            if (v !== 'custom') onChange(Number(v));
          }}
          className="h-10 bg-surface-overlay border border-border rounded-lg px-3
            text-sm text-text-primary focus:outline-none focus:border-accent
            appearance-none cursor-pointer min-w-[5rem]"
        >
          {presets.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {!isPreset && (
          <input
            type="number"
            min={0.1}
            step="any"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (v > 0 && Number.isFinite(v)) onChange(v);
            }}
            className="h-10 w-24 bg-surface-overlay border border-border rounded-lg px-3
              text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        )}
      </div>
    </div>
  );
}

function SizeSelect({
  printWidth,
  printHeight,
  onWidthChange,
  onHeightChange,
}: {
  printWidth: number;
  printHeight: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
}) {
  const matchedPreset = SIZE_PRESETS.find(
    (p) => p.w === printWidth && p.h === printHeight
  );

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs text-text-tertiary">Size (in)</label>
      <div className="flex gap-1.5">
        <select
          value={matchedPreset ? `${matchedPreset.w}x${matchedPreset.h}` : 'custom'}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'custom') return;
            const preset = SIZE_PRESETS.find((p) => `${p.w}x${p.h}` === v);
            if (preset) {
              onWidthChange(preset.w);
              onHeightChange(preset.h);
            }
          }}
          className="h-10 bg-surface-overlay border border-border rounded-lg px-3
            text-sm text-text-primary focus:outline-none focus:border-accent
            appearance-none cursor-pointer min-w-[5rem]"
        >
          {SIZE_PRESETS.map((p) => (
            <option key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {!matchedPreset && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0.5}
              step="any"
              value={printWidth}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (v > 0 && Number.isFinite(v)) onWidthChange(v);
              }}
              className="h-10 w-16 bg-surface-overlay border border-border rounded-lg px-2
                text-sm text-text-primary focus:outline-none focus:border-accent text-center"
            />
            <span className="text-text-tertiary text-xs">×</span>
            <input
              type="number"
              min={0.5}
              step="any"
              value={printHeight}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (v > 0 && Number.isFinite(v)) onHeightChange(v);
              }}
              className="h-10 w-16 bg-surface-overlay border border-border rounded-lg px-2
                text-sm text-text-primary focus:outline-none focus:border-accent text-center"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPanel({
  lpi,
  dpi,
  printWidth,
  printHeight,
  frameCount,
  onLpiChange,
  onDpiChange,
  onPrintWidthChange,
  onPrintHeightChange,
}: Props) {
  const stripWidth = frameCount > 0 ? dpi / lpi / frameCount : 0;
  const lensPitch = dpi / lpi;
  const outputWidth = Math.round(printWidth * dpi);
  const outputHeight = Math.round(printHeight * dpi);

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex flex-wrap gap-3">
        <InlineSelect
          label="LPI"
          value={lpi}
          presets={LPI_PRESETS}
          onChange={onLpiChange}
        />
        <InlineSelect
          label="DPI"
          value={dpi}
          presets={DPI_PRESETS}
          onChange={onDpiChange}
        />
        <SizeSelect
          printWidth={printWidth}
          printHeight={printHeight}
          onWidthChange={onPrintWidthChange}
          onHeightChange={onPrintHeightChange}
        />
      </div>

      {frameCount > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
          <span>
            Pitch:{' '}
            <span className="text-text-secondary font-mono">
              {lensPitch.toFixed(2)}px
            </span>
          </span>
          <span>
            Strip:{' '}
            <span className="text-text-secondary font-mono">
              {stripWidth.toFixed(2)}px
            </span>
          </span>
          <span>
            Frames:{' '}
            <span className="text-text-secondary font-mono">{frameCount}</span>
          </span>
          <span>
            Output:{' '}
            <span className="text-text-secondary font-mono">
              {outputWidth}&times;{outputHeight}px
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
