import { tv } from 'tailwind-variants';

const inputWrapper = tv({
  base: 'flex flex-col gap-1.5',
});

const inputLabel = tv({
  base: 'text-sm font-medium text-gray-700',
});

const inputElement = tv({
  base: [
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
    'text-gray-900 text-sm',
    'placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
});

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange?: (value: string) => void;
}

export function Input({
  label,
  onChange,
  className,
  ...props
}: InputProps) {
  return (
    <div className={inputWrapper({ className })}>
      {label && <label className={inputLabel()}>{label}</label>}
      <input
        className={inputElement()}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </div>
  );
}
