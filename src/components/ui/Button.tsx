import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white active:bg-brand-700 disabled:bg-ink-200 disabled:text-ink-400',
  secondary:
    'bg-white text-brand-700 border border-ink-200 active:bg-ink-50 disabled:text-ink-300 disabled:bg-ink-50',
  ghost: 'bg-transparent text-ink-600 active:bg-ink-100 disabled:text-ink-300',
  danger: 'bg-danger-500 text-white active:bg-danger-600 disabled:bg-ink-200 disabled:text-ink-400',
  success: 'bg-success-500 text-white active:bg-success-600 disabled:bg-ink-200 disabled:text-ink-400',
};

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-14 px-6 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
