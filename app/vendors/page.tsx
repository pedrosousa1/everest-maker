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

// ── Form state ────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  cat: VENDOR_CATEGORIES[0] as VendorCategory,
  customCat: "",
  phone: "",
  instagram: "",
  value: "",
  notes: "",
};
type FState = typeof EMPTY_FORM;

// ── Formulário básico ─────────────────────────────────────
function VForm({
  f,
  onChange,
  onSubmit,
  onCancel,
  autoFocusName,
}: {
  f: FState;
  onChange: (key: keyof FState, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  autoFocusName?: boolean;
}) {
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

      {/* Observações */}
      <div className="input-group">
        <label className="input-label">Observações</label>
        <textarea
          className="input-field"
          placeholder="Ex: Pagamento parcelado em 3x..."
          value={f.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={3}
          style={{ resize: "none" }}
        />
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

  function handleFormChange(
    setState: React.Dispatch<React.SetStateAction<FState>>,
  ) {
    return (key: keyof FState, value: string) =>
      setState((p) => ({ ...p, [key]: value }));
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
      notes: v.notes ?? "",
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
      }

      await vendorsApi.update(selected.id, {
        name: form.name.trim(),
        category: finalCat,
        phone: form.phone.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        value: parsedValue,
        notes: form.notes.trim() || undefined,
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
        notes: addForm.notes.trim() || undefined,
        budgetItemId,
      });
      setAddForm(EMPTY_FORM);
      setShowAdd(false);
      loadData();
      showToast("Fornecedor adicionado!", "", "success");
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
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/proposals"
            className="btn-secondary"
            style={{ padding: "8px 14px", fontSize: 13, width: "auto" }}
          >
            Ver Propostas
          </Link>
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
        </div>
      }
    >
      <div
        className="input-group"
        style={{ marginBottom: "var(--sp-lg)", marginTop: "var(--sp-sm)" }}
      >
        <input
          type="text"
          className="input-field"
          placeholder="Buscar fornecedores ou categorias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: "var(--color-black-card)" }}
        />
      </div>

      {vendors.length === 0 && search === "" ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Users size={28} />
          </div>
          <p className="empty-state__title">Nenhum fornecedor cadastrado</p>
          <p className="empty-state__text">
            Registre os fornecedores contratados para o seu casamento e tenha
            todos os contatos em um só lugar.
          </p>
          <button
            className="btn-primary"
            style={{ maxWidth: 220, marginTop: "var(--sp-md)" }}
            onClick={() => setShowAdd(true)}
          >
            Adicionar fornecedor
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: "var(--sp-xl) 0" }}>
          <p className="empty-state__title">Nenhum resultado</p>
          <p className="empty-state__text">
            Não encontramos fornecedores com "{search}"
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--sp-md)",
          }}
        >
          {filtered.map((v) => (
            <div
              key={v.id}
              className="card"
              style={{
                cursor: "pointer",
                transition: "border-color 0.15s, transform 0.15s",
              }}
              onClick={() => openDetail(v)}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--color-gold-border)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--color-black-border)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: 12,
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
                    color: "var(--color-gold)",
                    flexShrink: 0,
                  }}
                >
                  {CAT_ICONS[v.category] || <Package size={18} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--color-white)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 2,
                    }}
                  >
                    {v.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--color-gray)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{v.category}</span>
                  </p>
                </div>
              </div>

              {v.value && (
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--color-white)",
                    marginBottom: 12,
                    letterSpacing: -0.5,
                  }}
                >
                  {formatCurrency(v.value)}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {v.phone && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "var(--color-gray)",
                      background: "rgba(255,255,255,0.03)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Phone size={11} /> {v.phone}
                  </span>
                )}
                {v.instagram && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "var(--color-gray)",
                      background: "rgba(255,255,255,0.03)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Instagram size={11} /> {v.instagram}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALS ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Fornecedor</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>
                ✕
              </button>
            </div>
            <VForm
              f={addForm}
              onChange={handleFormChange(setAddForm)}
              onSubmit={handleAdd}
              onCancel={() => setShowAdd(false)}
              autoFocusName
            />
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Fornecedor</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <VForm
              f={form}
              onChange={handleFormChange(setForm)}
              onSubmit={handleUpdate}
              onCancel={() => setSelected(null)}
            />
            <button
              className="btn-secondary"
              style={{
                marginTop: "var(--sp-xl)",
                color: "var(--color-danger)",
                borderColor: "rgba(239, 68, 68, 0.2)",
              }}
              onClick={() => handleDelete(selected.id)}
            >
              Remover este fornecedor
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
