import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold tracking-[-0.01em] shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:active:translate-y-0 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary:
    "bg-sage-700 text-white shadow-[0_6px_14px_rgb(54_83_66/0.18)] hover:-translate-y-0.5 hover:bg-sage-900 hover:shadow-[0_9px_20px_rgb(54_83_66/0.22)] focus-visible:ring-sage-500",
  secondary:
    "border border-ink-950/15 bg-paper text-ink-800 hover:-translate-y-0.5 hover:border-sage-500/45 hover:bg-sage-50 hover:text-sage-900 focus-visible:ring-sage-500",
  danger: "bg-red-700 text-white shadow-[0_6px_14px_rgb(185_28_28/0.14)] hover:-translate-y-0.5 hover:bg-red-800 focus-visible:ring-red-500",
};

export function Button({
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <Spinner className="h-4 w-4 border-white" />}
      {children}
    </button>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
