"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  X,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Star,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import { proposalsApi, budgetApi, vendorsApi } from "@/lib/api";
import type { ApiProposal } from "@/lib/api";
import type { ProposalStatus, VendorCategory } from "@/lib/types";
import { VENDOR_CATEGORIES } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useAlert } from "@/components/CustomAlert";
import {
  maskCurrency,
  parseCurrency,
  numberToCurrencyInput,
} from "@/lib/masks";
import { formatCurrency } from "@/lib/storage";

const STATUS_LABELS: Record<ProposalStatus, string> = {
  negociando: "Negociando",
  fechado: "Fechado",
  recusado: "Recusado",
};
const STATUS_BADGE: Record<ProposalStatus, string> = {
  negociando: "badge badge--warning",
  fechado: "badge badge--success",
  recusado: "badge badge--danger",
};
const STATUS_BORDER: Record<ProposalStatus, string> = {
  negociando: "var(--color-warning)",
  fechado: "var(--color-success)",
  recusado: "var(--color-danger)",
};

// ── Rating fields ─────────────────────────────────────────
const RATING_FIELDS: { key: keyof RatingState; label: string; icon: string }[] =
  [
    { key: "ratingPrice", label: "Preço", icon: "💰" },
    { key: "ratingTrust", label: "Confiança", icon: "🤝" },
    { key: "ratingQuality", label: "Qualidade", icon: "⭐" },
    { key: "ratingService", label: "Atendimento", icon: "💬" },
  ];

interface RatingState {
  ratingPrice?: number;
  ratingTrust?: number;
  ratingQuality?: number;
  ratingService?: number;
}

// ── Termômetro score ──────────────────────────────────────
function calcScore(r: RatingState): number | null {
  const vals = [
    r.ratingPrice,
    r.ratingTrust,
    r.ratingQuality,
    r.ratingService,
  ].filter((v): v is number => v !== undefined && v !== null && v > 0);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function scoreColor(score: number): string {
  if (score >= 8) return "#4ade80";
  if (score >= 6) return "#fbbf24";
  if (score >= 4) return "#f97316";
  return "#f87171";
}

function scoreLabel(score: number): string {
  if (score >= 8.5) return "Excelente";
  if (score >= 7) return "Muito bom";
  if (score >= 5.5) return "Razoável";
  if (score >= 4) return "Abaixo do esperado";
  return "Insatisfatório";
}

// ── Componente de avaliação por slider ───────────────────
function RatingSlider({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const v = value ?? 0;
  const filled = v > 0;
  const color = filled ? scoreColor(v) : "var(--color-gray-dark)";

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--color-gray-light)",
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 15 }}>{icon}</span>
          {label}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: filled ? color : "var(--color-gray-dark)",
            minWidth: 28,
            textAlign: "right",
            transition: "color 0.2s",
          }}
        >
          {filled ? v : "—"}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${v * 10}%`,
            borderRadius: 8,
            background: filled
              ? `linear-gradient(90deg, ${color}88, ${color})`
              : "transparent",
            transition: "width 0.25s ease, background 0.25s ease",
          }}
        />
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        {[0, 2, 4, 6, 8, 10].map((n) => (
          <span
            key={n}
            style={{
              fontSize: 9,
              color: "var(--color-gray-dark)",
              lineHeight: 1,
            }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Termômetro de decisão ─────────────────────────────────
function DecisionThermometer({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed rgba(255,255,255,0.08)",
          textAlign: "center",
          color: "var(--color-gray-dark)",
          fontSize: 12,
        }}
      >
        Avalie para ver a nota do orçamento
      </div>
    );
  }

  const color = scoreColor(score);
  const pct = (score / 10) * 100;

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 14,
        background: `linear-gradient(135deg, ${color}0a, ${color}18)`,
        border: `1px solid ${color}33`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}20, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={16} color={color} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Decisão
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 12, color: `${color}99`, fontWeight: 600 }}>
            /10
          </span>
        </div>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          marginBottom: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 10,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: `0 0 12px ${color}60`,
          }}
        />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color, margin: 0 }}>
        {scoreLabel(score)}
      </p>
    </div>
  );
}

function ScoreBadge({ proposal }: { proposal: ApiProposal }) {
  const score = calcScore(proposal);
  if (score === null) return null;
  const color = scoreColor(score);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 20,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        flexShrink: 0,
      }}
    >
      <Star size={10} fill={color} color={color} />
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

// ── Form State ────────────────────────────────
const EMPTY_FORM = {
  vendorName: "",
  cat: VENDOR_CATEGORIES[0] as VendorCategory,
  customCat: "",
  value: "",
  status: "negociando" as ProposalStatus,
  notes: "",
};
type FState = typeof EMPTY_FORM;

const EMPTY_RATING: RatingState = {
  ratingPrice: undefined,
  ratingTrust: undefined,
  ratingQuality: undefined,
  ratingService: undefined,
};

// ── PÁGINA ─────────────────────────────────────
export default function ProposalsPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();
  const { showConfirm } = useAlert();
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<ApiProposal | null>(null);
  const [filter, setFilter] = useState<ProposalStatus | "all">("all");

  const [form, setForm] = useState<FState>(EMPTY_FORM);
  const [rating, setRating] = useState<RatingState>(EMPTY_RATING);

  const loadData = useCallback(async () => {
    try {
      const p = await proposalsApi.list();
      setProposals(p);
    } catch (err) {
      console.error("Proposals load error:", err);
    }
  }, []);
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return null;

  const filtered =
    filter === "all" ? proposals : proposals.filter((p) => p.status === filter);
  const countByStatus = (s: ProposalStatus) =>
    proposals.filter((p) => p.status === s).length;

  function resetForm() {
    setForm(EMPTY_FORM);
    setRating(EMPTY_RATING);
  }

  function handleRatingChange(key: keyof RatingState, value: number) {
    setRating((p) => ({ ...p, [key]: value === 0 ? undefined : value }));
  }

  function openDetail(p: ApiProposal) {
    setSelected(p);
    const knownCat = VENDOR_CATEGORIES.includes(p.category as VendorCategory);
    setForm({
      vendorName: p.vendorName,
      cat: knownCat
        ? (p.category as VendorCategory)
        : ("Outro" as VendorCategory),
      customCat: knownCat ? "" : p.category,
      value: numberToCurrencyInput(p.value),
      status: p.status,
      notes: p.notes ?? "",
    });
    setRating({
      ratingPrice: p.ratingPrice,
      ratingTrust: p.ratingTrust,
      ratingQuality: p.ratingQuality,
      ratingService: p.ratingService,
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendorName.trim() || !form.value) {
      showToast(
        "Campos obrigatórios",
        "Preencha fornecedor e valor.",
        "warning",
      );
      return;
    }
    const finalCat =
      form.cat === "Outro" && form.customCat.trim()
        ? form.customCat.trim()
        : form.cat;
    const parsedValue = parseCurrency(form.value);

    try {
      let budgetItemId: string | undefined;
      let vendorId: string | undefined;

      if (form.status === "fechado") {
        const bi = await budgetApi.create({
          category: finalCat,
          description: form.vendorName.trim(),
          amount: parsedValue,
          paidAmount: 0,
        });
        budgetItemId = bi.id;
        const v = await vendorsApi.create({
          name: form.vendorName.trim(),
          category: finalCat,
          value: parsedValue,
          notes: form.notes.trim() || undefined,
          budgetItemId: bi.id,
        });
        vendorId = v.id;
      }

      await proposalsApi.create({
        vendorName: form.vendorName.trim(),
        vendorId,
        category: finalCat,
        value: parsedValue,
        status: form.status,
        notes: form.notes.trim() || undefined,
        budgetItemId,
        ...rating,
      });
      resetForm();
      setShowAdd(false);
      loadData();
      showToast(
        form.status === "fechado"
          ? "🎉 Proposta fechada!"
          : "Proposta adicionada!",
        form.status === "fechado" ? "Adicionado aos Fornecedores." : "",
        "success",
      );
    } catch (err: unknown) {
      showToast(
        "Erro",
        err instanceof Error ? err.message : "Erro ao adicionar.",
        "danger",
      );
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!form.vendorName.trim() || !form.value) {
      showToast("Aviso", "Preencha fornecedor e valor.", "warning");
      return;
    }
    const finalCat =
      form.cat === "Outro" && form.customCat.trim()
        ? form.customCat.trim()
        : form.cat;
    const parsedValue = parseCurrency(form.value);

    try {
      const updateData: Partial<ApiProposal> = {
        vendorName: form.vendorName.trim(),
        category: finalCat,
        value: parsedValue,
        status: form.status,
        notes: form.notes.trim() || undefined,
        ...rating,
      };

      if (form.status === "fechado" && selected.status !== "fechado") {
        const bi = await budgetApi.create({
          category: finalCat,
          description: form.vendorName.trim(),
          amount: parsedValue,
          paidAmount: 0,
        });
        updateData.budgetItemId = bi.id;
        const v = await vendorsApi.create({
          name: form.vendorName.trim(),
          category: finalCat,
          value: parsedValue,
          notes: form.notes.trim() || undefined,
          budgetItemId: bi.id,
        });
        updateData.vendorId = v.id;
      } else if (selected.status === "fechado" && form.status !== "fechado") {
        if (selected.budgetItemId) {
          await budgetApi.delete(selected.budgetItemId);
          updateData.budgetItemId = undefined;
        }
        if (selected.vendorId) {
          await vendorsApi.delete(selected.vendorId);
          updateData.vendorId = undefined;
        }
      }

      await proposalsApi.update(selected.id, updateData);
      setSelected(null);
      loadData();
      showToast("Salvo!", "", "success");
    } catch (err: unknown) {
      showToast(
        "Erro",
        err instanceof Error ? err.message : "Erro ao atualizar.",
        "danger",
      );
    }
  }

  async function handleChangeStatus(
    p: ApiProposal,
    newStatus: ProposalStatus,
    e: React.MouseEvent,
  ) {
    e.stopPropagation();
    try {
      const updateData: Partial<ApiProposal> = { status: newStatus };

      if (newStatus === "fechado" && p.status !== "fechado") {
        const bi = await budgetApi.create({
          category: p.category,
          description: p.vendorName,
          amount: p.value,
          paidAmount: 0,
        });
        updateData.budgetItemId = bi.id;
        const v = await vendorsApi.create({
          name: p.vendorName,
          category: p.category,
          value: p.value,
          notes: p.notes,
          budgetItemId: bi.id,
        });
        updateData.vendorId = v.id;
      }

      if (p.status === "fechado" && newStatus !== "fechado") {
        if (p.budgetItemId) await budgetApi.delete(p.budgetItemId);
        if (p.vendorId) await vendorsApi.delete(p.vendorId);
        updateData.budgetItemId = undefined;
        updateData.vendorId = undefined;
      }

      await proposalsApi.update(p.id, updateData);
      loadData();
    } catch {
      showToast("Erro", "Falha ao mudar status.", "danger");
    }
  }

  function handleDelete(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    showConfirm(
      "Remover proposta?",
      "Deseja remover este orçamento?",
      async () => {
        const p = proposals.find((x) => x.id === id);
        if (p?.budgetItemId) await budgetApi.delete(p.budgetItemId);
        if (p?.vendorId) await vendorsApi.delete(p.vendorId);
        await proposalsApi.delete(id);
        setSelected(null);
        loadData();
      },
      "Remover",
      "danger",
    );
  }

  return (
    <AppShell
      title="Propostas"
      actions={
        <button
          className="btn-primary"
          style={{
            padding: "10px 18px",
            fontSize: 13,
            width: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={() => {
            resetForm();
            setShowAdd(true);
          }}
        >
          <Plus size={15} /> Novo orçamento
        </button>
      }
    >
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "var(--sp-sm)",
          marginBottom: "var(--sp-xl)",
          flexWrap: "wrap",
        }}
      >
        {(["all", "negociando", "fechado", "recusado"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
              background:
                filter === s
                  ? "var(--color-gold-muted)"
                  : "var(--color-black-card)",
              border: `1px solid ${filter === s ? "var(--color-gold)" : "var(--color-black-border)"}`,
              color: filter === s ? "var(--color-gold)" : "var(--color-gray)",
              transition: "all 0.15s",
            }}
          >
            {s === "all"
              ? `Todas (${proposals.length})`
              : `${STATUS_LABELS[s as ProposalStatus]} (${countByStatus(s as ProposalStatus)})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <FileText size={28} />
          </div>
          <p className="empty-state__title">
            {filter === "all"
              ? "Nenhum orçamento"
              : `Sem orçamentos ${STATUS_LABELS[filter as ProposalStatus]?.toLowerCase()}`}
          </p>
          <p className="empty-state__text">
            Registre cotações e propostas recebidas de fornecedores para
            compará-las
          </p>
          {filter === "all" && (
            <button
              className="btn-primary"
              style={{ maxWidth: 220, marginTop: "var(--sp-md)" }}
              onClick={() => {
                resetForm();
                setShowAdd(true);
              }}
            >
              Adicionar orçamento
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-md)",
          }}
        >
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card"
              onClick={() => openDetail(p)}
              style={{
                borderLeft: `3px solid ${STATUS_BORDER[p.status]}`,
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-sm)",
                cursor: "pointer",
                transition: "transform 0.15s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateX(4px)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 4,
                    }}
                  >
                    {p.vendorName}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="badge badge--gray">{p.category}</span>
                    <ScoreBadge proposal={p} />
                    {p.vendorId && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10,
                          color: "var(--color-success)",
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={11} /> Fornecedor criado
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <span className={STATUS_BADGE[p.status]}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    style={{
                      color: "var(--color-gray-dark)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      padding: 2,
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--color-gold)",
                  letterSpacing: -0.5,
                }}
              >
                {formatCurrency(p.value)}
              </p>

              {p.notes && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-gray)",
                    fontStyle: "italic",
                    borderLeft: "2px solid var(--color-black-border)",
                    paddingLeft: 8,
                  }}
                >
                  {p.notes}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  paddingTop: 4,
                  borderTop: "1px solid var(--color-black-border)",
                  marginTop: 4,
                }}
              >
                {(["negociando", "fechado", "recusado"] as ProposalStatus[])
                  .filter((s) => s !== p.status)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={(e) => handleChangeStatus(p, s, e)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontSize: 11,
                        cursor: "pointer",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "var(--color-black-soft)",
                        border: "1px solid var(--color-black-border)",
                        color: "var(--color-gray)",
                        transition: "all 0.15s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-gold)";
                        e.currentTarget.style.color = "var(--color-gold)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--color-black-border)";
                        e.currentTarget.style.color = "var(--color-gray)";
                      }}
                    >
                      <ChevronRight size={11} /> {STATUS_LABELS[s]}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALS (Novo / Editar) ── */}
      {(showAdd || selected) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAdd(false);
            setSelected(null);
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {showAdd ? "Novo Orçamento (Proposta)" : "Editar Orçamento"}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAdd(false);
                  setSelected(null);
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={showAdd ? handleAdd : handleUpdate}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-md)",
              }}
            >
              <div className="input-group">
                <label className="input-label">Fornecedor *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nome do fornecedor avaliado"
                  value={form.vendorName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vendorName: e.target.value }))
                  }
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--sp-md)",
                }}
              >
                <div className="input-group">
                  <label className="input-label">Categoria</label>
                  <select
                    className="input-field"
                    value={form.cat}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cat: e.target.value as VendorCategory,
                      }))
                    }
                  >
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {form.cat === "Outro" && (
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Especifique a categoria..."
                      value={form.customCat}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, customCat: e.target.value }))
                      }
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
                <div className="input-group">
                  <label className="input-label">Valor (R$) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-field"
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        value: maskCurrency(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Status</label>
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as ProposalStatus,
                    }))
                  }
                >
                  <option value="negociando">Negociando</option>
                  <option value="fechado">Fechado</option>
                  <option value="recusado">Recusado</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Observações</label>
                <textarea
                  className="input-field"
                  placeholder="Condições, o que inclui, etc..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              {/* ════ SEÇÃO DE AVALIAÇÃO ════ */}
              <div
                style={{
                  marginTop: 4,
                  padding: "20px 20px 4px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "rgba(198,167,94,0.12)",
                      border: "1px solid rgba(198,167,94,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={13} color="var(--color-gold)" />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--color-white)",
                        margin: 0,
                      }}
                    >
                      Avaliação & Comparação
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--color-gray-dark)",
                        margin: 0,
                      }}
                    >
                      Dê uma nota para embasar a sua escolha (1 a 10)
                    </p>
                  </div>
                </div>

                {RATING_FIELDS.map((f) => (
                  <RatingSlider
                    key={f.key}
                    label={f.label}
                    icon={f.icon}
                    value={rating[f.key]}
                    onChange={(v) => handleRatingChange(f.key, v)}
                  />
                ))}

                <div style={{ marginBottom: 16 }}>
                  <DecisionThermometer score={calcScore(rating)} />
                </div>
              </div>

              {form.status === "fechado" && (
                <div
                  style={{
                    background: "rgba(198,167,94,0.08)",
                    border: "1px solid var(--color-gold-border)",
                    borderRadius: "var(--r-md)",
                    padding: "var(--sp-md)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <CheckCircle2
                    size={15}
                    color="var(--color-gold)"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--color-gold)",
                      lineHeight: 1.5,
                    }}
                  >
                    Este orçamento será adicionado aos seus{" "}
                    <strong>Fornecedores</strong> ativos e o valor lançado no{" "}
                    <strong>Orçamento Geral</strong>.
                  </p>
                </div>
              )}

              <div
                style={{ display: "flex", gap: "var(--sp-md)", marginTop: 8 }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAdd(false);
                    setSelected(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {showAdd ? "Salvar orçamento" : "Atualizar orçamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
