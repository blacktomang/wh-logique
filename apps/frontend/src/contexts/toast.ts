import { createContext, useContext } from "react";

export type ToastVariant = "success" | "error";

export interface ToastMessage {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
}

export interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
