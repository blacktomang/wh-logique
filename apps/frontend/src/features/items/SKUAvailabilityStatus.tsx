export type SKUAvailabilityStatusValue =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

interface SKUAvailabilityStatusProps {
  status: SKUAvailabilityStatusValue;
}

export function SKUAvailabilityStatus({ status }: SKUAvailabilityStatusProps) {
  if (status === "idle" || status === "unavailable") return null;

  const icon = {
    checking: (
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500/25 border-t-sage-700"
        aria-hidden="true"
      />
    ),
    available: (
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        <path d="m5 10 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    unavailable: (
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="m6 6 8 8m0-8-8 8" strokeLinecap="round" />
      </svg>
    ),
    error: (
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M10 6v4m0 3h.01" strokeLinecap="round" />
        <circle cx="10" cy="10" r="7" />
      </svg>
    ),
  }[status];

  const label = {
    checking: "Checking SKU availability…",
    available: "SKU is available",
    unavailable: "SKU is already in use",
    error: "Availability could not be checked; it will be validated when you save",
  }[status];

  const color = {
    checking: "text-ink-600",
    available: "text-emerald-700",
    unavailable: "text-red-700",
    error: "text-amber-800",
  }[status];

  return (
    <p
      id="sku-availability-status"
      className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}
      role="status"
      aria-live="polite"
    >
      {icon}
      {label}
    </p>
  );
}
