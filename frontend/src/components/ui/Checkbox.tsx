import { tv } from 'tailwind-variants';

const checkboxWrapper = tv({
  base: 'flex items-center gap-2',
});

const checkboxElement = tv({
  base: [
    'h-4 w-4 rounded border-gray-300 text-blue-600',
    'focus:ring-2 focus:ring-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
});

const checkboxLabel = tv({
  base: 'text-sm text-gray-700',
});

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <label className={checkboxWrapper({ className })}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={checkboxElement()}
      />
      <span className={checkboxLabel()}>{label}</span>
    </label>
  );
}
