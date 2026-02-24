"use client";

import { maskCurrency, parseCurrency } from "@/lib/masks";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveWedding, generateId, setOnboardingDone } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/AuthContext";
import Onboarding from "@/components/Onboarding";

function formatDateInput(text: string) {
  const cleaned = text.replace(/\D/g, "");
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
}

function parseDate(value: string): string | null {
  if (value.length < 10) return null;
  const [d, m, y] = value.split("/");
  const day = parseInt(d, 10),
    month = parseInt(m, 10),
    year = parseInt(y, 10);
  const currentYear = new Date().getFullYear();
  if (month < 1 || month > 12 || year < currentYear || year > currentYear + 20)
    return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date <= today) return null;
  return date.toISOString();
}

export default function SetupWeddingPage() {
  const [venueName, setVenueName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { showToast } = useToast();
  const { setAuthenticated } = useAuth();
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const iso = parseDate(weddingDate);
    if (!iso) {
      showToast(
        "Data inválida",
        "Digite uma data real no formato DD/MM/AAAA e certifique-se de que é uma data futura.",
        "warning",
      );
      return;
    }
    setLoading(true);
    try {
      saveWedding({
        id: generateId(),
        coupleName: "",
        weddingDate: iso,
        venueName: venueName.trim() || undefined,
        totalBudget: parseCurrency(totalBudget),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setAuthenticated();
      setShowOnboarding(true);
    } catch {
      showToast("Erro", "Não foi possível salvar. Tente novamente.", "danger");
    } finally {
      setLoading(false);
    }
  }

  function handleOnboardingFinish() {
    setOnboardingDone();
    router.replace("/dashboard");
  }

  return (
    <>
      {showOnboarding && <Onboarding onFinish={handleOnboardingFinish} />}
      <div className="auth-page">
        <div className="auth-glow" />
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <div className="auth-logo">
            <img src="/logo.png" alt="Everest Planner" style={{ height: 40 }} />
          </div>

          <h1 className="auth-title" style={{ textAlign: "center" }}>
            Configure seu casamento
          </h1>
          <p className="auth-subtitle" style={{ textAlign: "center" }}>
            Essas informações podem ser alteradas depois!
          </p>

          <div
            className="gold-line"
            style={{ alignSelf: "center", margin: "0 auto var(--sp-xl)" }}
          />

          <form className="auth-form" onSubmit={handleSave}>
            <div className="input-group">
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Data do casamento *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="DD/MM/AAAA"
                value={weddingDate}
                onChange={(e) =>
                  setWeddingDate(formatDateInput(e.target.value))
                }
                maxLength={10}
                inputMode="numeric"
              />
            </div>

            <div className="input-group">
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Nome do espaço / local
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Chácara Villa Verde"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeWidth="2"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
                  <path d="M2 10h20" />
                </svg>
                Orçamento total (R$)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field"
                  placeholder="R$ 0,00"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(maskCurrency(e.target.value))}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? "Salvando..." : "Começar o planejamento"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
