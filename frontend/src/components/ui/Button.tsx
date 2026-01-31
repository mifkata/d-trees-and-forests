import { tv, type VariantProps } from 'tailwind-variants';

const button = tv({
  base: [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    variant: {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        'focus:ring-blue-500',
      ],
      secondary: [
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
      ],
      ghost: [
        'bg-transparent text-gray-600',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
      ],
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={button({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
