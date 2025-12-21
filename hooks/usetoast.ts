"use client";

import { useCallback } from "react";

type ToastOptions = {
  title?: string;
  description?: string;
};

export function useToast() {
  const toast = useCallback(({ title, description }: ToastOptions) => {
    const event = new CustomEvent("app-toast", {
      detail: { title, description },
    });
    window.dispatchEvent(event);
  }, []);

  return { toast };
}
