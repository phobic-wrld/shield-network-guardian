import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive";
}

export const useToasts = () => {
  const showSuccess = useCallback(
    (message: string, options?: Omit<ToastOptions, "variant">) => {
      toast({
        title: options?.title || "Success",
        description: message,
        duration: options?.duration || 3000,
        variant: "default",
      });
    },
    []
  );

  const showError = useCallback(
    (message: string, options?: Omit<ToastOptions, "variant">) => {
      toast({
        title: options?.title || "Error",
        description: message,
        duration: options?.duration || 5000,
        variant: "destructive",
      });
    },
    []
  );

  const showInfo = useCallback(
    (message: string, options?: Omit<ToastOptions, "variant">) => {
      toast({
        title: options?.title || "Info",
        description: message,
        duration: options?.duration || 4000,
        variant: "default",
      });
    },
    []
  );

  const showWarning = useCallback(
    (message: string, options?: Omit<ToastOptions, "variant">) => {
      toast({
        title: options?.title || "Warning",
        description: message,
        duration: options?.duration || 4000,
        variant: "default",
      });
    },
    []
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
