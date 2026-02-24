"use client";

import { useState, useCallback, createContext, useContext } from "react";

type ToastVariant = "success" | "warning" | "danger" | "info";

interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (title: string, message?: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (title: string, message?: string, variant: ToastVariant = "info") => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, title, message, variant }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000,
      );
    },
    [],
  );

  const icons: Record<ToastVariant, string> = {
    success: "✓",
    warning: "⚠",
    danger: "✕",
    info: "ℹ",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.variant}`}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
              {icons[t.variant]}
            </span>
            <div>
              <p className="toast__title">{t.title}</p>
              {t.message && <p className="toast__message">{t.message}</p>}
            </div>
            <button
              style={{
                marginLeft: "auto",
                color: "var(--color-gray-dark)",
                fontSize: 16,
                cursor: "pointer",
                background: "none",
                border: "none",
              }}
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
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
  return useContext(ToastContext);
}
