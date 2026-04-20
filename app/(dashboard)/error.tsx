'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>

      <p className="text-sm text-[#A89FB8] max-w-xs mb-6">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>

      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-lg bg-[#D4A843] text-[#0A0616] text-sm font-semibold hover:bg-[#e0b84e] transition-colors"
      >
        Try again
      </button>

      {error.digest && (
        <p className="mt-4 text-xs text-[#A89FB8] font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
