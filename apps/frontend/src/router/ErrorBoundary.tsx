import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { Button } from "../components/Button";

function ErrorPage({ title, message }: { title: string; message: string }) {
  return (
    <section className="grid min-h-dvh place-items-center bg-canvas px-5 text-center">
      <div className="max-w-lg rounded-2xl border border-ink-950/8 bg-paper p-8 shadow-[0_22px_60px_rgb(54_83_66/0.12)]">
        <p className="text-[0.7rem] font-bold tracking-[0.16em] text-red-700 uppercase">System notice</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink-950">{title}</h1>
        <p className="mt-3 text-pretty leading-6 text-ink-600">{message}</p>
        <Link to="/" className="mt-6 inline-block"><Button>Back to inventory</Button></Link>
      </div>
    </section>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <ErrorPage title={`${error.status} ${error.statusText}`} message={String(error.data)} />;
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return <ErrorPage title="Something went wrong" message={message} />;
}
