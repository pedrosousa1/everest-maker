"use client";

import { useState, useEffect } from "react";
import { Settings, Calendar, MapPin, Wallet, Save } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import { getWedding, saveWedding, generateId } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import type { WeddingData } from "@/lib/types";
import {
  maskCurrency,
  parseCurrency,
  numberToCurrencyInput,
} from "@/lib/masks";

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
  if (
    month < 1 ||
    month > 12 ||
    year < currentYear - 1 ||
    year > currentYear + 20
  )
    return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date.toISOString();
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function SettingsPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();

  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [weddingDate, setWeddingDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const w = getWedding();
    if (w) {
      setWedding(w);
      setWeddingDate(w.weddingDate ? toDateInput(w.weddingDate) : "");
      setVenueName(w.venueName ?? "");
      setTotalBudget(w.totalBudget ? numberToCurrencyInput(w.totalBudget) : "");
    }
  }, []);

  if (loading) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const iso = parseDate(weddingDate);
    if (weddingDate && !iso) {
      showToast("Data inválida", "Use o formato DD/MM/AAAA.", "warning");
      return;
    }
    setSaving(true);
    try {
      const existing = wedding;
      saveWedding({
        id: existing?.id ?? generateId(),
        coupleName: existing?.coupleName ?? "",
        weddingDate: iso ?? existing?.weddingDate ?? new Date().toISOString(),
        venueName: venueName.trim() || undefined,
        totalBudget: parseCurrency(totalBudget),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setWedding(getWedding());
      showToast("Configurações salvas!", "", "success");
    } catch {
      showToast("Erro ao salvar", "Tente novamente.", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Configurações">
      <div style={{ maxWidth: 520 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: "var(--sp-xl)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(198,167,94,0.08)",
              border: "1px solid rgba(198,167,94,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={18} color="var(--color-gold)" />
          </div>
          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--color-white)",
              }}
            >
              Dados do casamento
            </p>
            <p style={{ fontSize: 12, color: "var(--color-gray)" }}>
              Edite as informações principais do seu planejamento
            </p>
          </div>
        </div>

        <div
          className="card"
          style={{ animation: "fadeInScale 0.4s ease-out both" }}
        >
          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Data */}
            <div className="input-group">
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Calendar size={13} color="var(--color-gold)" />
                Data do casamento
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

            {/* Local */}
            <div className="input-group">
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <MapPin size={13} color="var(--color-gold)" />
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

            {/* Orçamento */}
            <div className="input-group">
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Wallet size={13} color="var(--color-gold)" />
                Orçamento total (R$)
              </label>
              <div>
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

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "var(--color-black-border)",
                margin: "4px 0",
              }}
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Save size={14} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
