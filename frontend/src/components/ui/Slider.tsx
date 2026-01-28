import { tv } from 'tailwind-variants';

const sliderWrapper = tv({
  base: 'flex flex-col gap-2',
});

const sliderHeader = tv({
  base: 'flex items-center justify-between',
});

const sliderLabel = tv({
  base: 'text-sm font-medium text-gray-700',
});

const sliderValue = tv({
  base: 'text-sm font-semibold text-gray-900',
});

const sliderInput = tv({
  base: [
    'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
    'accent-blue-600',
  ],
});

const sliderRange = tv({
  base: 'flex justify-between text-xs text-gray-500',
});

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  disabled,
  className,
}: SliderProps) {
  return (
    <div className={sliderWrapper({ className })}>
      <div className={sliderHeader()}>
        <span className={sliderLabel()}>{label}</span>
        <span className={sliderValue()}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={sliderInput()}
      />
      <div className={sliderRange()}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
