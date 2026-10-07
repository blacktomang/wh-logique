import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "../contexts/toast";
import type { ToastMessage, ToastVariant } from "../contexts/toast";

const durations: Record<ToastVariant, number> = {
  success: 4500,
  error: 6500,
};

let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((variant: ToastVariant, title: string, description?: string) => {
    const id = ++nextToastId;
    const duration = durations[variant];
    const toast: ToastMessage = {
      id,
      variant,
      title,
      duration,
      ...(description ? { description } : {}),
    };
    setToasts((current) => [...current.slice(-3), toast]);
    timers.current.set(id, setTimeout(() => dismiss(id), duration));
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const api = useMemo(() => ({
    success: (title: string, description?: string) => show("success", title, description),
    error: (title: string, description?: string) => show("error", title, description),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:w-[24rem]"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <article
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={`toast-enter pointer-events-auto relative w-full overflow-hidden rounded-xl border bg-paper/95 p-4 shadow-[0_18px_55px_rgb(23_32_31/0.22)] backdrop-blur-xl ${toast.variant === "success" ? "border-sage-500/25" : "border-red-500/25"}`}
          >
            <div className="flex items-start gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${toast.variant === "success" ? "bg-sage-100 text-sage-700" : "bg-red-50 text-red-700"}`} aria-hidden="true">
                {toast.variant === "success" ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m6.5 12.5 3.5 3.5 7.5-8" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v5M12 16.5v.1" /><circle cx="12" cy="12" r="9" /></svg>
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-bold tracking-[-0.015em] text-ink-950">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm leading-5 text-ink-600">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-600 transition-colors hover:bg-ink-950/5 hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
                aria-label="Dismiss notification"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 7 10 10M17 7 7 17" /></svg>
              </button>
            </div>
            <span
              className={`toast-progress absolute inset-x-0 bottom-0 h-0.5 origin-left ${toast.variant === "success" ? "bg-sage-500" : "bg-red-500"}`}
              style={{ animationDuration: `${toast.duration}ms` }}
              aria-hidden="true"
            />
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
