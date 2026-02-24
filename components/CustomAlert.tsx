"use client";

import {
  useState,
  useCallback,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
  XCircle,
} from "lucide-react";

/* ─── Types ─── */
export type AlertVariant =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "confirm";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  variant: AlertVariant;
  buttons: AlertButton[];
}

interface AlertContextType {
  alertState: AlertState;
  showAlert: (
    title: string,
    message?: string,
    variant?: AlertVariant,
    onOk?: () => void,
  ) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    variant?: AlertVariant,
  ) => void;
  dismiss: () => void;
}

const INITIAL: AlertState = {
  visible: false,
  title: "",
  variant: "info",
  buttons: [],
};

const AlertContext = createContext<AlertContextType>({
  alertState: INITIAL,
  showAlert: () => {},
  showConfirm: () => {},
  dismiss: () => {},
});

/* ─── Variant config ─── */
const VARIANT_CFG: Record<
  AlertVariant,
  { Icon: typeof Info; color: string; glow: string }
> = {
  info: {
    Icon: Info,
    color: "var(--color-gold)",
    glow: "rgba(198,167,94,0.12)",
  },
  success: {
    Icon: CheckCircle2,
    color: "var(--color-success)",
    glow: "rgba(52,199,89,0.12)",
  },
  warning: {
    Icon: AlertTriangle,
    color: "var(--color-warning)",
    glow: "rgba(255,159,10,0.12)",
  },
  danger: {
    Icon: XCircle,
    color: "var(--color-danger)",
    glow: "rgba(255,69,58,0.12)",
  },
  confirm: {
    Icon: HelpCircle,
    color: "var(--color-gold)",
    glow: "rgba(198,167,94,0.12)",
  },
};

/* ─── Provider ─── */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>(INITIAL);
  const cardRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(
    () => setState((prev) => ({ ...prev, visible: false })),
    [],
  );

  const showAlert = useCallback(
    (
      title: string,
      message?: string,
      variant: AlertVariant = "info",
      onOk?: () => void,
    ) => {
      setState({
        visible: true,
        title,
        message,
        variant,
        buttons: [{ text: "OK", style: "default", onPress: onOk }],
      });
    },
    [],
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = "Confirmar",
      variant: AlertVariant = "confirm",
    ) => {
      setState({
        visible: true,
        title,
        message,
        variant,
        buttons: [
          { text: "Cancelar", style: "cancel" },
          { text: confirmText, style: "destructive", onPress: onConfirm },
        ],
      });
    },
    [],
  );

  function handlePress(btn: AlertButton) {
    btn.onPress?.();
    dismiss();
  }

  // Escape para fechar
  useEffect(() => {
    if (!state.visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.visible, dismiss]);

  // Animação de entrada
  useEffect(() => {
    if (state.visible && cardRef.current) {
      const el = cardRef.current;
      el.style.opacity = "0";
      el.style.transform = "scale(0.92)";
      requestAnimationFrame(() => {
        el.style.transition =
          "opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)";
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      });
    }
  }, [state.visible]);

  const cfg = VARIANT_CFG[state.variant];

  return (
    <AlertContext.Provider
      value={{ alertState: state, showAlert, showConfirm, dismiss }}
    >
      {children}

      {state.visible && (
        <div
          onClick={dismiss}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            ref={cardRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#141414",
              border: "1px solid rgba(198,167,94,0.2)",
              borderRadius: "var(--r-xl)",
              padding: "var(--sp-xl)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 8px 32px rgba(198,167,94,0.08)",
            }}
          >
            {/* Ícone */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: cfg.glow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "var(--sp-lg)",
              }}
            >
              <cfg.Icon size={30} color={cfg.color} />
            </div>

            {/* Título */}
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                textAlign: "center",
                color: "var(--color-white)",
                marginBottom: 6,
              }}
            >
              {state.title}
            </h3>

            {/* Mensagem */}
            {state.message && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-gray)",
                  textAlign: "center",
                  lineHeight: 1.6,
                  marginBottom: 4,
                  whiteSpace: "pre-line",
                }}
              >
                {state.message}
              </p>
            )}

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: 1,
                background: "var(--color-black-border)",
                margin: "var(--sp-lg) 0",
              }}
            />

            {/* Botões */}
            <div
              style={{ display: "flex", gap: "var(--sp-sm)", width: "100%" }}
            >
              {state.buttons.map((btn, i) => {
                const isDestructive = btn.style === "destructive";
                const isCancel = btn.style === "cancel";

                return (
                  <button
                    key={i}
                    onClick={() => handlePress(btn)}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: "var(--r-md)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: isCancel
                        ? "1px solid var(--color-black-border)"
                        : isDestructive
                          ? "1px solid rgba(255,69,58,0.3)"
                          : "none",
                      background: isCancel
                        ? "var(--color-black-card)"
                        : isDestructive
                          ? "rgba(255,69,58,0.10)"
                          : "linear-gradient(90deg, #C6A75E, #A88C48)",
                      color: isCancel
                        ? "var(--color-gray)"
                        : isDestructive
                          ? "var(--color-danger)"
                          : "#0A0A0A",
                    }}
                  >
                    {btn.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

/* ─── Hook ─── */
export function useAlert() {
  return useContext(AlertContext);
}
