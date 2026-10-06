export interface ErrorDetail {
  field?: string;
  reason: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

/**
 * Standard API envelope returned by every backend endpoint.
 * `data` and `meta` are omitted by the backend when absent (`omitempty`),
 * so they are optional here.
 */
export interface Envelope<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ErrorDetail[];
}
