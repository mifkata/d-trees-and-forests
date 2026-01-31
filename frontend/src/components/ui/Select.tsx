import { tv } from 'tailwind-variants';
import { InfoIcon } from './Tooltip';

const selectWrapper = tv({
  base: 'flex flex-col gap-1.5',
});

const selectLabel = tv({
  base: 'text-sm font-medium text-gray-700 flex items-center gap-1',
});

const selectElement = tv({
  base: [
    'block w-full rounded-lg border bg-white px-3 py-2',
    'text-gray-900 text-sm',
    'focus:outline-none focus:ring-2 focus:border-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    error: {
      true: 'border-red-500 focus:ring-red-500',
      false: 'border-gray-300 focus:ring-blue-500',
    },
  },
  defaultVariants: {
    error: false,
  },
});

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  tooltip?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function Select({
  label,
  tooltip,
  value,
  onChange,
  options,
  disabled,
  error,
  className,
}: SelectProps) {
  return (
    <div className={selectWrapper({ className })}>
      {label && (
        <label className={selectLabel()}>
          {label}
          {tooltip && <InfoIcon tooltip={tooltip} />}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectElement({ error })}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
