import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

const fieldClass =
  "h-11 w-full rounded-lg border border-ink-950/20 bg-paper px-3.5 text-[0.925rem] text-ink-950 shadow-[inset_0_1px_2px_rgb(23_32_31/0.04),0_1px_0_rgb(255_255_255/0.8)] outline-none transition-all duration-200 placeholder:text-ink-600/55 hover:border-sage-500/70 focus:border-sage-500 focus:ring-4 focus:ring-sage-500/12 disabled:cursor-not-allowed disabled:bg-ink-950/5 disabled:text-ink-600 aria-invalid:border-red-500 aria-invalid:ring-red-500/10";

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="grid min-w-[11rem] gap-2">
      <span className="text-[0.78rem] font-bold tracking-[0.045em] text-ink-800">{label}</span>
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        className={`${fieldClass} cursor-pointer appearance-none pr-11 font-medium ${className}`}
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-1.5 right-1.5 grid w-8 place-items-center rounded-md border border-sage-500/15 bg-sage-50 text-sage-700" aria-hidden="true">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}
