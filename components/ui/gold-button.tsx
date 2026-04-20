'use client';

import { Loader2 } from 'lucide-react';

type Variant = 'solid' | 'outline' | 'ghost' | 'danger';

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  solid:   'btn-gold',
  outline: 'btn-outline-gold',
  ghost:   'btn-ghost',
  danger:  'btn-danger',
};

export function GoldButton({
  variant = 'solid',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: GoldButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${variantClass[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
