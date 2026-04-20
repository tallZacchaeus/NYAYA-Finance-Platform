'use client';

import { AnimatedNumber } from './animated-number';

interface NairaAmountProps {
  amount: number;
  compact?: boolean;
  animated?: boolean;
  className?: string;
  gold?: boolean;
}

function formatNaira(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000)     return `₦${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)         return `₦${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function NairaAmount({
  amount,
  compact = false,
  animated = false,
  className = '',
  gold = true,
}: NairaAmountProps) {
  const baseClass = `font-display tabular-nums ${gold ? 'text-[#D4A843]' : ''} ${className}`;

  if (animated) {
    return (
      <AnimatedNumber
        value={amount}
        className={baseClass}
        formatter={(n) => formatNaira(n, compact)}
      />
    );
  }

  return (
    <span className={baseClass}>
      {formatNaira(amount, compact)}
    </span>
  );
}
