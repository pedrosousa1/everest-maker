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
import {
  getVendors,
  addVendor,
  updateVendor,
  deleteVendor,
  generateId,
  formatCurrency,
  getWedding,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetItems,
} from "@/lib/storage";
import type { Vendor, VendorCategory } from "@/lib/types";
import { VENDOR_CATEGORIES } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useAlert } from "@/components/CustomAlert";
import {
  maskCurrency,
  parseCurrency,
  maskPhone,
  numberToCurrencyInput,
} from "@/lib/masks";

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

const EMPTY_FORM = {
  name: "",
  cat: VENDOR_CATEGORIES[0] as VendorCategory,
  customCat: "",
  phone: "",
  instagram: "",
  value: "",
};
type FState = typeof EMPTY_FORM;

/* ── Formulário compartilhado como componente fora do render ── */
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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-md)",
      }}
    >
      <div className="input-group">
        <label className="input-label">Nome *</label>
        <input
          type="text"
          className="input-field"
          value={f.name}
          onChange={(e) => onChange("name", e.target.value)}
          autoFocus={autoFocusName}
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
            value={f.cat}
            onChange={(e) => onChange("cat", e.target.value)}
            style={{
              background: "var(--color-black-card)",
              cursor: "pointer",
            }}
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
              placeholder="Especifique a categoria..."
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

export default function VendorsPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();
  const { showConfirm } = useAlert();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FState>(EMPTY_FORM);
  const [addForm, setAddForm] = useState<FState>(EMPTY_FORM);

  const loadData = useCallback(() => setVendors(getVendors()), []);
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

  function openDetail(v: Vendor) {
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
  }

  function handleUpdate(e: React.FormEvent) {
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
    const wedding = getWedding();

    const updated: Vendor = {
      ...selected,
      name: form.name.trim(),
      category: finalCat,
      phone: form.phone.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
      value: parsedValue,
    };

    // Sincroniza com orçamento
    if (selected.budgetItemId && parsedValue) {
      // Tinha budget e continua com valor → atualiza
      const budgetItems = getBudgetItems();
      const existing = budgetItems.find((b) => b.id === selected.budgetItemId);
      if (existing) {
        updateBudgetItem({
          ...existing,
          description: updated.name,
          category: finalCat,
          amount: parsedValue,
        });
      }
    } else if (selected.budgetItemId && !parsedValue) {
      // Tinha budget mas removeu valor → deleta budget
      deleteBudgetItem(selected.budgetItemId);
      updated.budgetItemId = undefined;
    } else if (!selected.budgetItemId && parsedValue) {
      // Não tinha budget e agora tem valor → cria budget
      const budgetId = generateId();
      addBudgetItem({
        id: budgetId,
        weddingId: wedding?.id ?? "",
        category: finalCat,
        description: updated.name,
        amount: parsedValue,
        paidAmount: 0,
        createdAt: new Date().toISOString(),
      });
      updated.budgetItemId = budgetId;
    }

    updateVendor(updated);
    setSelected(null);
    loadData();
    showToast("Salvo!", "", "success");
  }

  function handleAdd(e: React.FormEvent) {
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
    const wedding = getWedding();

    const vendor: Vendor = {
      id: generateId(),
      weddingId: wedding?.id ?? "",
      name: addForm.name.trim(),
      category: finalCat,
      phone: addForm.phone.trim() || undefined,
      instagram: addForm.instagram.trim() || undefined,
      value: parsedValue,
      createdAt: new Date().toISOString(),
    };

    // Se tem valor, cria item de orçamento vinculado
    if (parsedValue) {
      const budgetId = generateId();
      addBudgetItem({
        id: budgetId,
        weddingId: wedding?.id ?? "",
        category: finalCat,
        description: vendor.name,
        amount: parsedValue,
        paidAmount: 0,
        createdAt: new Date().toISOString(),
      });
      vendor.budgetItemId = budgetId;
    }

    addVendor(vendor);
    setAddForm(EMPTY_FORM);
    setShowAdd(false);
    loadData();
    showToast(
      "Fornecedor adicionado!",
      parsedValue ? "Gasto adicionado ao orçamento." : "",
      "success",
    );
  }

  function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const vendor = vendors.find((v) => v.id === id);
    showConfirm(
      "Remover fornecedor?",
      vendor?.budgetItemId
        ? "O gasto vinculado no orçamento também será removido."
        : "Deseja remover este fornecedor?",
      () => {
        // Remove budget item vinculado
        if (vendor?.budgetItemId) {
          deleteBudgetItem(vendor.budgetItemId);
        }
        deleteVendor(id);
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
        }}
      >
        <span className="badge badge--gold">Total: {vendors.length}</span>
        <span className="badge badge--gray">
          Categorias: {new Set(vendors.map((v) => v.category)).size}
        </span>
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
                transition: "border-color 0.15s",
                color: "var(--color-white)",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-gold-border)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor =
                  "var(--color-black-border)")
              }
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
                    marginBottom: 3,
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
                {/* mini indicadores */}
                <div style={{ display: "flex", gap: 5 }}>
                  {v.phone && (
                    <Phone size={12} color="var(--color-gray-dark)" />
                  )}
                  {v.instagram && (
                    <Instagram size={12} color="var(--color-gray-dark)" />
                  )}
                </div>
                {/* delete direto no card */}
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

      {/* ── MODAL DETALHE/EDIÇÃO ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto" }}
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
            />
          </div>
        </div>
      )}

      {/* ── MODAL ADICIONAR ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo fornecedor</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setAddForm(EMPTY_FORM);
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
                setShowAdd(false);
              }}
              autoFocusName
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
