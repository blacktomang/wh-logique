import type { ErrorDetail } from "../types/api";

interface ErrorAlertProps {
  message: string;
  details?: ErrorDetail[];
}

export function ErrorAlert({ message, details }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300/70 bg-red-50 px-4 py-3.5 text-sm text-red-900 shadow-[0_6px_18px_rgb(185_28_28/0.06)]"
    >
      <strong className="font-semibold">{message}</strong>
      {details && details.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {details.map((detail, index) => (
            <li key={`${detail.field ?? "error"}-${index}`}>
              {detail.field ? `${detail.field}: ` : ""}
              {detail.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
