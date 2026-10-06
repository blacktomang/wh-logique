export function Spinner() {
  return (
    <div className="grid min-h-72 place-items-center" role="status" aria-label="Loading">
      <div className="flex items-center gap-3 rounded-xl border border-ink-950/8 bg-paper/80 px-5 py-4 text-sm font-semibold text-ink-600 shadow-[0_12px_35px_rgb(54_83_66/0.08)] backdrop-blur">
        <span className="relative h-5 w-5">
          <span className="absolute inset-0 rounded-md border-2 border-sage-500/20" />
          <span className="absolute inset-0 animate-spin rounded-md border-2 border-transparent border-t-sage-700" />
        </span>
        Loading workspace…
      </div>
    </div>
  );
}
