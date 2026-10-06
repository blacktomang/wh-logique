import type { Envelope, ErrorDetail } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/**
 * A normalized API error carrying the backend's structured details, when
 * present. Transport/network failures use a synthetic message and no details.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details: ErrorDetail[];

  constructor(status: number, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Sends a request against the envelope API and returns the full envelope,
 * preserving `meta` for paginated resources.
 * Throws `ApiError` on any non-2xx status or transport failure.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(0, "Network error: unable to reach the server");
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || body?.success === false) {
    const message = body?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, body?.errors ?? []);
  }

  return body ?? ({ success: true, message: "OK" } as Envelope<T>);
}

/** Convenience wrapper that returns only `data`, discarding the envelope. */
export async function requestData<T>(path: string, init: RequestInit = {}): Promise<T> {
  const envelope = await request<T>(path, init);
  return envelope.data as T;
}
