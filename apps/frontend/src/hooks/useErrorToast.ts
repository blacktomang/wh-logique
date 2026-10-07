import { useEffect } from "react";
import { ApiError } from "../api/client";
import { useToast } from "../contexts/toast";

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function errorDescription(error: unknown) {
  if (!(error instanceof ApiError) || error.details.length === 0) return undefined;
  return error.details.map((detail) => detail.reason).join(" · ");
}

export function useErrorToast(error: unknown, fallback: string) {
  const toast = useToast();

  useEffect(() => {
    if (error) toast.error(errorMessage(error, fallback), errorDescription(error));
  }, [error, fallback, toast]);
}
