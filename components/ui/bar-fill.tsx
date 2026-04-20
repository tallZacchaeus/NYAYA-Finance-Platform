'use client';

interface BarFillProps {
  pct: number;
  colorClass?: string;
}

export function BarFill({ pct, colorClass = 'bg-[#BB913B]' }: BarFillProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
      style={{ width: `${clamped}%` }}
    />
  );
}
