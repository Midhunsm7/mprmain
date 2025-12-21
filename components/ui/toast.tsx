"use client";

import { useEffect, useState } from "react";

type ToastData = {
  title?: string;
  description?: string;
};

export default function Toast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    function handler(e: any) {
      setToast(e.detail);
      setTimeout(() => setToast(null), 3000);
    }

    window.addEventListener("app-toast", handler);
    return () => window.removeEventListener("app-toast", handler);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="bg-black text-white rounded-lg shadow-lg p-4 w-80">
        {toast.title && (
          <p className="font-semibold">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm opacity-80 mt-1">
            {toast.description}
          </p>
        )}
      </div>
    </div>
  );
}
