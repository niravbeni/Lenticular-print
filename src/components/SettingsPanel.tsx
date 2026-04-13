interface Props {
  lpi: number;
  dpi: number;
  frameCount: number;
  imageWidth: number | null;
  imageHeight: number | null;
  onLpiChange: (v: number) => void;
  onDpiChange: (v: number) => void;
}

const LPI_PRESETS = [15, 20, 40, 50, 50.24, 60, 75, 100];
const DPI_PRESETS = [300, 600, 720, 1200, 1440];

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

export default function SettingsPanel({
  lpi,
  dpi,
  frameCount,
  imageWidth,
  imageHeight,
  onLpiChange,
  onDpiChange,
}: Props) {
  const stripWidth = frameCount > 0 ? dpi / lpi / frameCount : 0;
  const lensPitch = dpi / lpi;
  const printWidthInches = imageWidth ? imageWidth / dpi : null;
  const printHeightInches = imageHeight ? imageHeight / dpi : null;
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex gap-3">
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
          {printWidthInches !== null && printHeightInches !== null && (
            <span>
              Print:{' '}
              <span className="text-text-secondary font-mono">
                {printWidthInches.toFixed(1)}&times;{printHeightInches.toFixed(1)}&Prime;
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
