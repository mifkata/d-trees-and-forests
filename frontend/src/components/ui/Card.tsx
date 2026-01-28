import { tv, type VariantProps } from 'tailwind-variants';

const card = tv({
  base: 'rounded-lg border bg-white',
  variants: {
    variant: {
      default: 'border-gray-200',
      elevated: 'border-gray-200 shadow-md',
      outlined: 'border-gray-300',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

interface CardProps extends VariantProps<typeof card> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ variant, padding, children, className }: CardProps) {
  return (
    <div className={card({ variant, padding, className })}>
      {children}
    </div>
  );
}

const cardHeader = tv({
  base: 'flex items-center justify-between border-b border-gray-200 pb-4 mb-4',
});

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cardHeader({ className })}>{children}</div>;
}

const cardTitle = tv({
  base: 'text-lg font-semibold text-gray-900',
});

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={cardTitle({ className })}>{children}</h3>;
}
