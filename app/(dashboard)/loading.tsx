export default function DashboardLoading() {
  return (
    <div className="p-5 sm:p-7 space-y-7 animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-[#2D1A73]" />
        <div className="h-4 w-72 rounded-md bg-[#1A0F4D]" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 bg-[#13093B] border border-[#2D1A73] space-y-3"
          >
            <div className="h-3 w-24 rounded bg-[#1A0F4D]" />
            <div className="h-8 w-20 rounded bg-[#2D1A73]" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="rounded-xl bg-[#13093B] border border-[#2D1A73] overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-3 border-b border-[#1A0F4D] flex gap-4">
          {[120, 200, 100, 80, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-[#2D1A73]" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="px-5 py-4 border-b border-[#1A0F4D] flex gap-4 items-center"
          >
            {[120, 200, 100, 80, 60].map((w, j) => (
              <div
                key={j}
                className="h-3 rounded bg-[#1A0F4D]"
                style={{ width: w, opacity: 1 - i * 0.1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
