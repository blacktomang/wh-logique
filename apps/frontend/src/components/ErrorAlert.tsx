import type { ErrorDetail } from "../types/api";

interface ErrorAlertProps {
  message: string;
  details?: ErrorDetail[];
}

export function ErrorAlert({ message, details }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800"
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
