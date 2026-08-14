"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Toast = {
  id: number;
  message: string;
};

type ToastContextValue = {
  success: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const success = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ success }), [success]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 sm:left-auto"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-ink bg-ink px-4 py-3.5 text-paper-light shadow-[5px_5px_0_var(--vermilion)]"
            key={toast.id}
            role="status"
          >
            <span
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mineral text-xs font-bold"
              aria-hidden="true"
            >
              ✓
            </span>
            <p className="text-sm font-semibold leading-5">{toast.message}</p>
            <button
              className="ml-auto -mr-1 min-h-6 min-w-6 text-paper/65 hover:text-paper-light"
              type="button"
              onClick={() =>
                setToasts((current) =>
                  current.filter((currentToast) => currentToast.id !== toast.id),
                )
              }
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
