import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Something went wrong</h1>
      <p>{message}</p>
      <Link to="/">Back to home</Link>
    </div>
  );
}
