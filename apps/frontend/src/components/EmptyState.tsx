import type { ReactNode } from "react";

export function EmptyState({ message, description, action }: { message: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-sage-500/35 bg-sage-50/45 px-6 py-12 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-paper text-sage-700 shadow-[0_8px_22px_rgb(54_83_66/0.12)] ring-1 ring-sage-500/15">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M5 5.5h14v13H5zM8 9h8M8 12h5" />
          </svg>
        </span>
        <p className="font-bold tracking-[-0.02em] text-ink-950">{message}</p>
        {description && <p className="mt-1.5 text-sm leading-6 text-ink-600">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
