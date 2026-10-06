import type { ErrorDetail } from "../types/api";

interface ErrorAlertProps {
  message: string;
  details?: ErrorDetail[];
}

export function ErrorAlert({ message, details }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        padding: "0.75rem 1rem",
        borderRadius: "0.375rem",
      }}
    >
      <strong>{message}</strong>
      {details && details.length > 0 && (
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
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
