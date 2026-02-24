"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Trash2,
  Plus,
  Pencil,
  TrendingUp,
  TrendingDown,
  Minus,
  Link2,
  DollarSign,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import {
  getWedding,
  getBudgetItems,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  saveWedding,
  generateId,
  formatCurrency,
  getProposals,
  updateProposal,
  deleteVendor,
} from "@/lib/storage";
import type {
  BudgetItem,
  WeddingData,
  VendorCategory,
  Proposal,
} from "@/lib/types";
import { VENDOR_CATEGORIES } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useAlert } from "@/components/CustomAlert";
import {
  maskCurrency,
  parseCurrency,
  numberToCurrencyInput,
} from "@/lib/masks";

type Grouped = Record<string, BudgetItem[]>;

function StatusIcon({ pct }: { pct: number }) {
  if (pct >= 100) return <TrendingDown size={14} color="var(--color-danger)" />;
  if (pct >= 80) return <Minus size={14} color="var(--color-warning)" />;
  return <TrendingUp size={14} color="var(--color-success)" />;
}

function statusColor(pct: number) {
  if (pct >= 100) return "var(--color-danger)";
  if (pct >= 80) return "var(--color-warning)";
  return "var(--color-success)";
}

function statusLabel(pct: number) {
  if (pct >= 100) return "Orçamento estourado";
  if (pct >= 80) return "Próximo do limite";
  return "Dentro do orçamento";
}

export default function BudgetPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();
  const { showConfirm } = useAlert();

  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);

  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<VendorCategory>(VENDOR_CATEGORIES[0]);
  const [customCat, setCustomCat] = useState("");
  const [amount, setAmount] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [editingPaid, setEditingPaid] = useState<string | null>(null);
  const [paidInput, setPaidInput] = useState("");

  const loadData = useCallback(() => {
    setWedding(getWedding());
    setItems(getBudgetItems());
    setProposals(getProposals());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return null;

  const totalBudget = wedding?.totalBudget ?? 0;
  const totalSpent = items.reduce((s, i) => s + i.amount, 0);
  const totalPaid = items.reduce((s, i) => s + i.paidAmount, 0);
  const totalUnpaid = totalSpent - totalPaid;
  const remaining = totalBudget - totalSpent;
  const pct =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const color = statusColor(pct);

  function handleUpdatePaid(item: BudgetItem, newPaid: number) {
    const clamped = Math.min(Math.max(0, newPaid), item.amount);
    updateBudgetItem({ ...item, paidAmount: clamped });
    setEditingPaid(null);
    setPaidInput("");
    loadData();
  }

  const grouped: Grouped = {};
  items.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = [];
    grouped[i.category].push(i);
  });

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const finalCat =
      cat === "Outro" && customCat.trim() ? customCat.trim() : cat;
    if (!desc.trim() || !amount) {
      showToast(
        "Campos obrigatórios",
        "Preencha descrição e valor.",
        "warning",
      );
      return;
    }
    addBudgetItem({
      id: generateId(),
      weddingId: wedding?.id ?? "",
      category: finalCat,
      description: desc.trim(),
      amount: parseCurrency(amount),
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    });
    setDesc("");
    setAmount("");
    setCat(VENDOR_CATEGORIES[0]);
    setCustomCat("");
    setShowAdd(false);
    loadData();
    showToast("Gasto adicionado!", "", "success");
  }

  // Retorna a proposta vinculada ao item, se existir
  function linkedProposal(itemId: string): Proposal | undefined {
    return proposals.find((p) => p.budgetItemId === itemId);
  }

  function handleDeleteItem(item: BudgetItem) {
    const linked = linkedProposal(item.id);

    if (linked) {
      showConfirm(
        "Remover gasto vinculado?",
        `"${item.description}" veio de uma proposta fechada com ${linked.vendorName}.\n\nRemover este gasto irá:\n• Voltar a proposta para "Negociando"\n• Remover o fornecedor correspondente`,
        () => {
          const updated = {
            ...linked,
            status: "negociando" as const,
            budgetItemId: undefined,
            vendorId: undefined,
          };
          updateProposal(updated);
          if (linked.vendorId) deleteVendor(linked.vendorId);
          deleteBudgetItem(item.id);
          loadData();
          showToast(
            "Gasto removido",
            "Proposta voltou para Negociando.",
            "info",
          );
        },
        "Remover",
        "danger",
      );
    } else {
      showConfirm(
        "Remover gasto?",
        `Deseja remover "${item.description}"?`,
        () => {
          deleteBudgetItem(item.id);
          loadData();
        },
        "Remover",
        "danger",
      );
    }
  }

  function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    const v = parseCurrency(newBudget);
    if (isNaN(v) || v < 0) {
      showToast("Valor inválido", "", "warning");
      return;
    }
    if (wedding) {
      saveWedding({ ...wedding, totalBudget: v });
      loadData();
      setShowBudgetEdit(false);
    }
  }

  return (
    <AppShell
      title="Orçamento"
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-lg)",
        }}
      >
        {/* ── HERO CARD ── */}
        <div
          style={{
            background: "linear-gradient(140deg, #1C1A14, #111)",
            border: "1px solid var(--color-gold-border)",
            borderRadius: "var(--r-xl)",
            padding: "var(--sp-xl)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow decorativo */}
          <div
            style={{
              position: "absolute",
              bottom: -60,
              right: -60,
              width: 200,
              height: 200,
              background:
                "radial-gradient(circle, rgba(198,167,94,0.10) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Label + botão editar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--color-gold)",
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: 0.8,
              }}
            >
              Orçamento total
            </p>
            <button
              onClick={() => {
                setNewBudget(numberToCurrencyInput(totalBudget));
                setShowBudgetEdit(true);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "var(--color-gray)",
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 6,
                transition: "color 0.15s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.color = "var(--color-gold)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.color = "var(--color-gray)")
              }
            >
              <Pencil size={12} /> Editar
            </button>
          </div>

          {/* Valor principal */}
          <p
            style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: -1,
              marginBottom: "var(--sp-lg)",
              lineHeight: 1.2,
            }}
          >
            {formatCurrency(totalBudget)}
          </p>

          {/* Barra de progresso — igual ao dashboard */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-sm)",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 6,
                background: "var(--color-black-border)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: color,
                  borderRadius: 999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                minWidth: 36,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {pct.toFixed(0)}%
            </span>
          </div>

          {/* Status label */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--sp-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <StatusIcon pct={pct} />
              <span style={{ fontSize: 12, color }}>{statusLabel(pct)}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>
              {pct.toFixed(0)}%
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(198,167,94,0.15)",
              marginBottom: "var(--sp-lg)",
            }}
          />

          {/* Dois stats: Investido + Saldo */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--sp-md)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--color-gray)",
                  marginBottom: 4,
                }}
              >
                Investido
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--color-gold)",
                }}
              >
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--color-gray)",
                  marginBottom: 4,
                }}
              >
                {remaining < 0 ? "Excedido" : "Disponível"}
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color:
                    remaining < 0
                      ? "var(--color-danger)"
                      : "var(--color-success)",
                }}
              >
                {formatCurrency(Math.abs(remaining))}
              </p>
            </div>
          </div>

          {/* Pago / A pagar */}
          {totalSpent > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--sp-md)",
                marginTop: "var(--sp-md)",
                paddingTop: "var(--sp-md)",
                borderTop: "1px solid var(--color-black-border)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--color-gray)",
                    marginBottom: 3,
                    letterSpacing: 0.5,
                  }}
                >
                  ✓ Pago
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-success)",
                  }}
                >
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--color-gray)",
                    marginBottom: 3,
                    letterSpacing: 0.5,
                  }}
                >
                  ○ A pagar
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-warning)",
                  }}
                >
                  {formatCurrency(totalUnpaid)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── LISTA DE GASTOS ── */}
        {Object.keys(grouped).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Wallet size={28} />
            </div>
            <p className="empty-state__title">Nenhum gasto registrado</p>
            <p className="empty-state__text">
              Registre os gastos do seu casamento para acompanhar o orçamento
            </p>
            <button
              className="btn-primary"
              style={{
                maxWidth: 220,
                marginTop: "var(--sp-md)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "center",
                margin: "var(--sp-md) auto 0",
              }}
              onClick={() => setShowAdd(true)}
            >
              <Plus size={14} /> Adicionar gasto
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--sp-xl)",
            }}
          >
            {Object.entries(grouped).map(([category, catItems]) => {
              const catTotal = catItems.reduce((s, i) => s + i.amount, 0);
              const catPct =
                totalBudget > 0 ? (catTotal / totalBudget) * 100 : 0;

              return (
                <div key={category}>
                  {/* Cabeçalho da categoria */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "var(--sp-sm)",
                      paddingBottom: "var(--sp-sm)",
                      borderBottom: "1px solid var(--color-black-border)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 3,
                          height: 16,
                          background: "var(--color-gold)",
                          borderRadius: 99,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--color-white-muted)",
                        }}
                      >
                        {category}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-gray-dark)",
                          background: "var(--color-black-soft)",
                          border: "1px solid var(--color-black-border)",
                          borderRadius: 999,
                          padding: "1px 7px",
                        }}
                      >
                        {catItems.length}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>
                        {formatCurrency(catTotal)}
                      </p>
                      {totalBudget > 0 && (
                        <p
                          style={{
                            fontSize: 10,
                            color: "var(--color-gray-dark)",
                            marginTop: 1,
                          }}
                        >
                          {catPct.toFixed(0)}% do total
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Itens */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {catItems.map((item) => {
                      const linked = linkedProposal(item.id);
                      return (
                        <div
                          key={item.id}
                          style={{
                            background: "var(--color-black-card)",
                            border: `1px solid ${linked ? "rgba(198,167,94,0.25)" : "var(--color-black-border)"}`,
                            borderLeft: `3px solid ${item.paidAmount >= item.amount ? "var(--color-success)" : linked ? "var(--color-gold)" : "var(--color-gold)"}`,
                            borderRadius: "var(--r-md)",
                            padding: "12px var(--sp-md)",
                            transition: "border-color 0.15s",
                          }}
                        >
                          {/* Linha principal */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.description}
                              </p>
                              {linked && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    fontSize: 10,
                                    color: "var(--color-gold)",
                                    opacity: 0.8,
                                    marginTop: 2,
                                  }}
                                >
                                  <Link2 size={9} /> via proposta fechada
                                </span>
                              )}
                            </div>

                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--color-gold)",
                                flexShrink: 0,
                              }}
                            >
                              {formatCurrency(item.amount)}
                            </span>

                            {/* Botão registrar pago */}
                            <button
                              onClick={() => {
                                setEditingPaid(item.id);
                                setPaidInput(
                                  numberToCurrencyInput(item.paidAmount),
                                );
                              }}
                              title="Registrar valor pago"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                padding: 4,
                                borderRadius: 4,
                                color:
                                  item.paidAmount >= item.amount
                                    ? "var(--color-success)"
                                    : "var(--color-gray-dark)",
                                transition: "color 0.15s",
                                flexShrink: 0,
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.color =
                                  "var(--color-success)")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.color =
                                  item.paidAmount >= item.amount
                                    ? "var(--color-success)"
                                    : "var(--color-gray-dark)")
                              }
                            >
                              <DollarSign size={15} />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item)}
                              style={{
                                color: "var(--color-black-border)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                padding: 4,
                                borderRadius: 4,
                                transition: "color 0.15s",
                                flexShrink: 0,
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.color =
                                  "var(--color-danger)")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.color =
                                  "var(--color-black-border)")
                              }
                              title={
                                linked ? "Remover (desfaz proposta)" : "Remover"
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Edição inline do valor pago */}
                          {editingPaid === item.id && (
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--color-gray)",
                                  flexShrink: 0,
                                }}
                              >
                                R$ pago:
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="input-field"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: 12,
                                  height: "auto",
                                  flex: 1,
                                }}
                                value={paidInput}
                                onChange={(e) =>
                                  setPaidInput(maskCurrency(e.target.value))
                                }
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleUpdatePaid(
                                      item,
                                      parseCurrency(paidInput),
                                    );
                                  if (e.key === "Escape") {
                                    setEditingPaid(null);
                                    setPaidInput("");
                                  }
                                }}
                              />
                              <button
                                className="btn-primary"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: 11,
                                  width: "auto",
                                }}
                                onClick={() =>
                                  handleUpdatePaid(
                                    item,
                                    parseCurrency(paidInput),
                                  )
                                }
                              >
                                OK
                              </button>
                              <button
                                className="btn-secondary"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  width: "auto",
                                }}
                                onClick={() => {
                                  setEditingPaid(null);
                                  setPaidInput("");
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )}

                          {/* Barra pago/total */}
                          <div>
                            <div
                              style={{
                                height: 4,
                                background: "var(--color-black-border)",
                                borderRadius: 999,
                                overflow: "hidden",
                                marginBottom: 4,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${item.amount > 0 ? Math.min((item.paidAmount / item.amount) * 100, 100) : 0}%`,
                                  background:
                                    item.paidAmount >= item.amount
                                      ? "var(--color-success)"
                                      : "var(--color-gold)",
                                  borderRadius: 999,
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 10,
                                color: "var(--color-gray-dark)",
                              }}
                            >
                              <span style={{ color: "var(--color-success)" }}>
                                ✓ {formatCurrency(item.paidAmount)}
                              </span>
                              {item.paidAmount < item.amount && (
                                <span>
                                  restam{" "}
                                  {formatCurrency(
                                    item.amount - item.paidAmount,
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Total de itens */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "var(--sp-md)",
                background: "var(--color-black-soft)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--color-black-border)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--color-gray)" }}>
                {items.length}{" "}
                {items.length === 1 ? "gasto registrado" : "gastos registrados"}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {formatCurrency(totalSpent)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ADICIONAR GASTO ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Adicionar gasto</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>
                ✕
              </button>
            </div>
            <form
              onSubmit={handleAddItem}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-md)",
              }}
            >
              <div className="input-group">
                <label className="input-label">Descrição *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Fotógrafo principal"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Valor (R$) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field"
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={(e) => setAmount(maskCurrency(e.target.value))}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Categoria</label>
                <select
                  className="input-field"
                  value={cat}
                  onChange={(e) => setCat(e.target.value as VendorCategory)}
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
                {cat === "Outro" && (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Especifique a categoria..."
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              <div
                style={{ display: "flex", gap: "var(--sp-md)", marginTop: 8 }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAdd(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ORÇAMENTO ── */}
      {showBudgetEdit && (
        <div className="modal-overlay" onClick={() => setShowBudgetEdit(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400 }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Editar orçamento total</h2>
              <button
                className="modal-close"
                onClick={() => setShowBudgetEdit(false)}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSaveBudget}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-md)",
              }}
            >
              <div className="input-group">
                <label className="input-label">Orçamento total (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field"
                  placeholder="R$ 0,00"
                  value={newBudget}
                  onChange={(e) => setNewBudget(maskCurrency(e.target.value))}
                  autoFocus
                />
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--color-gray)",
                  marginTop: -8,
                }}
              >
                Este é o orçamento máximo planejado para o casamento.
              </p>
              <div style={{ display: "flex", gap: "var(--sp-md)" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowBudgetEdit(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
