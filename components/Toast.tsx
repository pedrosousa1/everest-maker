"use client";

// ════════════════════════════════════════════════════════════════
// Toast.tsx — wrapper do Sonner que mantém a API original
//   showToast(title, message?, variant?)
//   variant: "success" | "warning" | "danger" | "info"
// ════════════════════════════════════════════════════════════════

import { useCallback, createContext, useContext } from "react";
import { toast, Toaster } from "sonner";

type ToastVariant = "success" | "warning" | "danger" | "info";

interface ToastContextType {
  showToast: (title: string, message?: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

// ── Ícones SVG inline para cada variante ─────────────────────────
function IconSuccess() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
function IconDanger() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

// ── Cores e ícones por variante ───────────────────────────────────
const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  success: {
    icon: <IconSuccess />,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.25)",
  },
  warning: {
    icon: <IconWarning />,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
  },
  danger: {
    icon: <IconDanger />,
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.25)",
  },
  info: {
    icon: <IconInfo />,
    color: "#C6A75E",
    bg: "rgba(198,167,94,0.08)",
    border: "rgba(198,167,94,0.25)",
  },
};

// ── Provider ──────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastContext.Provider value={{ showToast: sonnerShowToast }}>
        {children}
      </ToastContext.Provider>
      <Toaster
        position="bottom-right"
        expand={false}
        gap={10}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: "everest-toast",
          },
        }}
      />
    </>
  );
}

// ── Função principal (usada pelo contexto e exportada diretamente) ─
function sonnerShowToast(
  title: string,
  message?: string,
  variant: ToastVariant = "info",
) {
  const cfg = VARIANT_CONFIG[variant];

  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        background: "rgba(20,20,22,0.95)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
        minWidth: 280,
        maxWidth: 380,
        color: cfg.color,
      }}
    >
      {/* Ícone */}
      <span style={{ flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            color: cfg.color,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {title}
        </p>
        {message && (
          <p
            style={{
              fontSize: 12.5,
              color: "rgba(255,255,255,0.55)",
              marginTop: 3,
              lineHeight: 1.5,
              margin: "3px 0 0",
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* Barra de progresso colorida no topo */}
      <style>{`
        @keyframes everest-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .everest-toast {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );

  // Usa o método genérico do Sonner com nosso JSX customizado
  toast.custom(() => content, {
    duration: 4000,
    position: "bottom-right",
  });
}

// ── Hook ──────────────────────────────────────────────────────────
export function useToast() {
  return useContext(ToastContext);
}
