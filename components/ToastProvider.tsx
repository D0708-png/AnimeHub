"use client";

import { useEffect, useState } from "react";

export interface ToastPayload {
  id?: string;
  message: string;
  tone?: "success" | "info" | "danger";
}

declare global {
  interface WindowEventMap {
    "animehub:toast": CustomEvent<ToastPayload>;
  }
}

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("animehub:toast", { detail: payload }));
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Required<ToastPayload>[]>([]);

  useEffect(() => {
    function handleToast(event: WindowEventMap["animehub:toast"]) {
      const nextToast: Required<ToastPayload> = {
        id: event.detail.id ?? `${Date.now()}-${Math.random()}`,
        message: event.detail.message,
        tone: event.detail.tone ?? "info"
      };

      setToasts((current) => [nextToast, ...current].slice(0, 4));

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== nextToast.id));
      }, 3200);
    }

    window.addEventListener("animehub:toast", handleToast);
    return () => window.removeEventListener("animehub:toast", handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[80] grid w-[min(24rem,calc(100vw-2rem))] gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-2xl border border-white/10 bg-night/92 px-4 py-3 text-sm font-bold text-white shadow-glow backdrop-blur-2xl"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
