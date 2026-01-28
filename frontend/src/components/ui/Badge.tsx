import { tv, type VariantProps } from 'tailwind-variants';

const badge = tv({
  base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  variants: {
    variant: {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface BadgeProps extends VariantProps<typeof badge> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return <span className={badge({ variant, className })}>{children}</span>;
}
