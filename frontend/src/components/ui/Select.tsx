import { tv } from 'tailwind-variants';

const selectWrapper = tv({
  base: 'flex flex-col gap-1.5',
});

const selectLabel = tv({
  base: 'text-sm font-medium text-gray-700',
});

const selectElement = tv({
  base: [
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
    'text-gray-900 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
});

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  className,
}: SelectProps) {
  return (
    <div className={selectWrapper({ className })}>
      {label && <label className={selectLabel()}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectElement()}
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
