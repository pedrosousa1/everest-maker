"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Phone,
  Instagram,
  Camera,
  Film,
  Utensils,
  Flower2,
  Music,
  Shirt,
  Cake,
  BookOpen,
  Car,
  Building2,
  Scissors,
  Sparkles,
  Package,
  FileText,
  Trash2,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import { vendorsApi, budgetApi } from "@/lib/api";
import type { ApiVendor } from "@/lib/api";
import type { VendorCategory } from "@/lib/types";
import { VENDOR_CATEGORIES } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useAlert } from "@/components/CustomAlert";
import {
  maskCurrency,
  parseCurrency,
  maskPhone,
  numberToCurrencyInput,
} from "@/lib/masks";
import { formatCurrency } from "@/lib/storage";

// ── Ícones por categoria ─────────────────────────────────
const CAT_ICONS: Record<string, React.ReactNode> = {
  Fotografia: <Camera size={18} />,
  Filmagem: <Film size={18} />,
  Buffet: <Utensils size={18} />,
  Decoração: <Flower2 size={18} />,
  "Música / DJ": <Music size={18} />,
  Vestido: <Shirt size={18} />,
  "Traje do noivo": <Shirt size={18} />,
  Bolo: <Cake size={18} />,
  Convites: <BookOpen size={18} />,
  Cerimonial: <Sparkles size={18} />,
  Transporte: <Car size={18} />,
  "Local / Espaço": <Building2 size={18} />,
  "Maquiagem / Cabelo": <Scissors size={18} />,
  Flores: <Flower2 size={18} />,
  Outro: <Package size={18} />,
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
  ].filter((v): v is number => v !== undefined && v !== null);
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
      {/* Label + valor */}
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

      {/* Track */}
      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Preenchido */}
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

        {/* Input range invisível por cima */}
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

      {/* Pontos de referência */}
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
        Avalie os critérios acima para ver o termômetro de decisão
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
      {/* Brilho decorativo */}
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
            Termômetro de decisão
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

      {/* Barra de progresso */}
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

      {/* Rótulo */}
      <p style={{ fontSize: 14, fontWeight: 700, color, margin: 0 }}>
        {scoreLabel(score)}
      </p>
      <p
        style={{
          fontSize: 11.5,
          color: "rgba(255,255,255,0.4)",
          margin: "3px 0 0",
        }}
      >
        Média das avaliações preenchidas
      </p>
    </div>
  );
}

// ── Mini score badge (nos cards da lista) ─────────────────
function ScoreBadge({ vendor }: { vendor: ApiVendor }) {
  const score = calcScore(vendor);
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
      }}
    >
      <Star size={10} fill={color} color={color} />
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  cat: VENDOR_CATEGORIES[0] as VendorCategory,
  customCat: "",
  phone: "",
  instagram: "",
  value: "",
};
type FState = typeof EMPTY_FORM;

const EMPTY_RATING: RatingState = {
  ratingPrice: undefined,
  ratingTrust: undefined,
  ratingQuality: undefined,
  ratingService: undefined,
};

// ── Formulário básico ─────────────────────────────────────
function VForm({
  f,
  onChange,
  onSubmit,
  onCancel,
  autoFocusName,
  rating,
  onRatingChange,
}: {
  f: FState;
  onChange: (key: keyof FState, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  autoFocusName?: boolean;
  rating: RatingState;
  onRatingChange: (key: keyof RatingState, value: number) => void;
}) {
  const score = calcScore(rating);

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}
    >
      {/* Nome */}
      <div className="input-group">
        <label className="input-label">Nome *</label>
        <input
          type="text"
          className="input-field"
          value={f.name}
          onChange={(e) => onChange("name", e.target.value)}
          autoFocus={autoFocusName}
          placeholder="Ex: Estúdio Lumê Fotografia"
        />
      </div>

      {/* Categoria + Valor */}
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
            value={f.cat}
            onChange={(e) => onChange("cat", e.target.value)}
            style={{ background: "var(--color-black-card)", cursor: "pointer" }}
          >
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {f.cat === "Outro" && (
            <input
              type="text"
              className="input-field"
              placeholder="Especifique..."
              value={f.customCat}
              onChange={(e) => onChange("customCat", e.target.value)}
              style={{ marginTop: 8 }}
            />
          )}
        </div>
        <div className="input-group">
          <label className="input-label">Valor (R$)</label>
          <input
            type="text"
            inputMode="numeric"
            className="input-field"
            placeholder="R$ 0,00"
            value={f.value}
            onChange={(e) => onChange("value", maskCurrency(e.target.value))}
          />
        </div>
      </div>

      {/* Contato */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--sp-md)",
        }}
      >
        <div className="input-group">
          <label className="input-label">Telefone</label>
          <input
            type="tel"
            className="input-field"
            placeholder="(11) 99999-9999"
            value={f.phone}
            onChange={(e) => onChange("phone", maskPhone(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Instagram</label>
          <input
            type="text"
            className="input-field"
            placeholder="@usuario"
            value={f.instagram}
            onChange={(e) => onChange("instagram", e.target.value)}
          />
        </div>
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
        {/* Cabeçalho */}
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
            <Star size={13} color="var(--color-gold)" />
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
              Avaliação do fornecedor
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--color-gray-dark)",
                margin: 0,
              }}
            >
              Deslize para avaliar de 0 a 10
            </p>
          </div>
        </div>

        {/* Sliders */}
        {RATING_FIELDS.map((f) => (
          <RatingSlider
            key={f.key}
            label={f.label}
            icon={f.icon}
            value={rating[f.key]}
            onChange={(v) => onRatingChange(f.key, v)}
          />
        ))}

        {/* Termômetro */}
        <div style={{ marginBottom: 16 }}>
          <DecisionThermometer score={score} />
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: "var(--sp-md)", marginTop: 4 }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Salvar
        </button>
      </div>
    </form>
  );
}

// ═════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════
export default function VendorsPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();
  const { showConfirm } = useAlert();

  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [selected, setSelected] = useState<ApiVendor | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FState>(EMPTY_FORM);
  const [addForm, setAddForm] = useState<FState>(EMPTY_FORM);
  const [rating, setRating] = useState<RatingState>(EMPTY_RATING);
  const [addRating, setAddRating] = useState<RatingState>(EMPTY_RATING);

  const loadData = useCallback(async () => {
    try {
      const v = await vendorsApi.list();
      setVendors(v);
    } catch (err) {
      console.error("Vendors load error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  if (loading) return null;

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()),
  );

  // Média geral de todos fornecedores avaliados
  const evaluated = vendors.filter((v) => calcScore(v) !== null);
  const overallAvg =
    evaluated.length > 0
      ? Math.round(
          (evaluated.reduce((s, v) => s + (calcScore(v) ?? 0), 0) /
            evaluated.length) *
            10,
        ) / 10
      : null;

  function handleFormChange(
    setState: React.Dispatch<React.SetStateAction<FState>>,
  ) {
    return (key: keyof FState, value: string) =>
      setState((p) => ({ ...p, [key]: value }));
  }

  function handleRatingChange(
    setState: React.Dispatch<React.SetStateAction<RatingState>>,
  ) {
    return (key: keyof RatingState, value: number) =>
      setState((p) => ({ ...p, [key]: value === 0 ? undefined : value }));
  }

  function openDetail(v: ApiVendor) {
    setSelected(v);
    const knownCat = VENDOR_CATEGORIES.includes(v.category as VendorCategory);
    setForm({
      name: v.name,
      cat: knownCat
        ? (v.category as VendorCategory)
        : ("Outro" as VendorCategory),
      customCat: knownCat ? "" : v.category,
      phone: v.phone ?? "",
      instagram: v.instagram ?? "",
      value: v.value ? numberToCurrencyInput(v.value) : "",
    });
    setRating({
      ratingPrice: v.ratingPrice,
      ratingTrust: v.ratingTrust,
      ratingQuality: v.ratingQuality,
      ratingService: v.ratingService,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !form.name.trim()) {
      showToast("Nome obrigatório", "", "warning");
      return;
    }
    const finalCat =
      form.cat === "Outro" && form.customCat.trim()
        ? form.customCat.trim()
        : form.cat;
    const parsedValue = parseCurrency(form.value) || undefined;

    try {
      if (selected.budgetItemId && parsedValue) {
        await budgetApi.update(selected.budgetItemId, {
          description: form.name.trim(),
          category: finalCat,
          amount: parsedValue,
        });
      } else if (selected.budgetItemId && !parsedValue) {
        await budgetApi.delete(selected.budgetItemId);
      }

      let budgetItemId = selected.budgetItemId;
      if (!selected.budgetItemId && parsedValue) {
        const bi = await budgetApi.create({
          category: finalCat,
          description: form.name.trim(),
          amount: parsedValue,
          paidAmount: 0,
        });
        budgetItemId = bi.id;
      }

      await vendorsApi.update(selected.id, {
        name: form.name.trim(),
        category: finalCat,
        phone: form.phone.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        value: parsedValue,
        budgetItemId,
        ...rating,
      });
      setSelected(null);
      loadData();
      showToast("Fornecedor salvo!", "", "success");
    } catch (err: unknown) {
      showToast(
        "Erro",
        err instanceof Error ? err.message : "Erro ao salvar.",
        "danger",
      );
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) {
      showToast("Nome obrigatório", "", "warning");
      return;
    }
    const finalCat =
      addForm.cat === "Outro" && addForm.customCat.trim()
        ? addForm.customCat.trim()
        : addForm.cat;
    const parsedValue = parseCurrency(addForm.value) || undefined;

    try {
      let budgetItemId: string | undefined;
      if (parsedValue) {
        const bi = await budgetApi.create({
          category: finalCat,
          description: addForm.name.trim(),
          amount: parsedValue,
          paidAmount: 0,
        });
        budgetItemId = bi.id;
      }
      await vendorsApi.create({
        name: addForm.name.trim(),
        category: finalCat,
        phone: addForm.phone.trim() || undefined,
        instagram: addForm.instagram.trim() || undefined,
        value: parsedValue,
        budgetItemId,
        ...addRating,
      });
      setAddForm(EMPTY_FORM);
      setAddRating(EMPTY_RATING);
      setShowAdd(false);
      loadData();
      showToast(
        "Fornecedor adicionado!",
        parsedValue ? "Gasto adicionado ao orçamento." : "",
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

  function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const vendor = vendors.find((v) => v.id === id);
    showConfirm(
      "Remover fornecedor?",
      vendor?.budgetItemId
        ? "O gasto vinculado no orçamento também será removido."
        : "Deseja remover este fornecedor?",
      async () => {
        if (vendor?.budgetItemId) await budgetApi.delete(vendor.budgetItemId);
        await vendorsApi.delete(id);
        setSelected(null);
        loadData();
      },
      "Remover",
      "danger",
    );
  }

  return (
    <AppShell
      title="Fornecedores"
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
          onClick={() => setShowAdd(true)}
        >
          <Plus size={15} /> Adicionar
        </button>
      }
    >
      {/* Busca */}
      <div style={{ marginBottom: "var(--sp-md)", position: "relative" }}>
        <input
          type="text"
          className="input-field"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
        <Users
          size={15}
          color="var(--color-gray-dark)"
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "var(--sp-sm)",
          marginBottom: "var(--sp-xl)",
          flexWrap: "wrap",
        }}
      >
        <span className="badge badge--gold">Total: {vendors.length}</span>
        <span className="badge badge--gray">
          Categorias: {new Set(vendors.map((v) => v.category)).size}
        </span>
        {overallAvg !== null && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: `${scoreColor(overallAvg)}18`,
              border: `1px solid ${scoreColor(overallAvg)}44`,
              color: scoreColor(overallAvg),
            }}
          >
            <Star
              size={11}
              fill={scoreColor(overallAvg)}
              color={scoreColor(overallAvg)}
            />
            Média: {overallAvg}
          </span>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Users size={28} />
          </div>
          <p className="empty-state__title">
            {search ? "Nenhum resultado" : "Nenhum fornecedor cadastrado"}
          </p>
          <p className="empty-state__text">
            {search
              ? `Sem resultados para "${search}"`
              : "Adicione manualmente ou feche uma proposta"}
          </p>
          {!search && (
            <div
              style={{
                display: "flex",
                gap: "var(--sp-md)",
                marginTop: "var(--sp-lg)",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-primary"
                style={{
                  maxWidth: 180,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "center",
                }}
                onClick={() => setShowAdd(true)}
              >
                <Plus size={14} /> Adicionar
              </button>
              <Link
                href="/proposals"
                className="btn-secondary"
                style={{
                  maxWidth: 180,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                <FileText size={14} /> Propostas
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-sm)",
          }}
        >
          {filtered.map((v) => (
            <div
              key={v.id}
              onClick={() => openDetail(v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-md)",
                background: "var(--color-black-card)",
                border: "1px solid var(--color-black-border)",
                borderRadius: "var(--r-lg)",
                padding: "var(--sp-md)",
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
                color: "var(--color-white)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--color-gold-border)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(198,167,94,0.08)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--color-black-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Ícone */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "var(--r-md)",
                  flexShrink: 0,
                  background: "var(--color-gold-muted)",
                  border: "1px solid var(--color-gold-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-gold)",
                }}
              >
                {CAT_ICONS[v.category] ?? <Package size={18} />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 5,
                    color: "var(--color-white)",
                  }}
                >
                  {v.name}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="badge badge--gray">{v.category}</span>
                  {v.value && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--color-gold)",
                      }}
                    >
                      {formatCurrency(v.value)}
                    </span>
                  )}
                  {/* Score badge */}
                  <ScoreBadge vendor={v} />
                </div>
              </div>

              {/* Ações */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", gap: 5 }}>
                  {v.phone && (
                    <Phone size={12} color="var(--color-gray-dark)" />
                  )}
                  {v.instagram && (
                    <Instagram size={12} color="var(--color-gray-dark)" />
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(v.id, e)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    padding: 4,
                    borderRadius: 4,
                    color: "var(--color-gray-dark)",
                    transition: "color 0.15s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.color = "var(--color-danger)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.color = "var(--color-gray-dark)")
                  }
                  title="Remover"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL EDIÇÃO ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              overflowY: "auto",
              maxWidth: 520,
              width: "95vw",
            }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--color-gold-muted)",
                    border: "1px solid var(--color-gold-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-gold)",
                    flexShrink: 0,
                  }}
                >
                  {CAT_ICONS[selected.category] ?? <Package size={15} />}
                </div>
                <h2 className="modal-title" style={{ fontSize: 16 }}>
                  {selected.name}
                </h2>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <VForm
              f={form}
              onChange={handleFormChange(setForm)}
              onSubmit={handleUpdate}
              onCancel={() => setSelected(null)}
              rating={rating}
              onRatingChange={handleRatingChange(setRating)}
            />
          </div>
        </div>
      )}

      {/* ── MODAL ADICIONAR ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              overflowY: "auto",
              maxWidth: 520,
              width: "95vw",
            }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Novo fornecedor</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setAddForm(EMPTY_FORM);
                  setAddRating(EMPTY_RATING);
                  setShowAdd(false);
                }}
              >
                ✕
              </button>
            </div>
            <VForm
              f={addForm}
              onChange={handleFormChange(setAddForm)}
              onSubmit={handleAdd}
              onCancel={() => {
                setAddForm(EMPTY_FORM);
                setAddRating(EMPTY_RATING);
                setShowAdd(false);
              }}
              autoFocusName
              rating={addRating}
              onRatingChange={handleRatingChange(setAddRating)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
