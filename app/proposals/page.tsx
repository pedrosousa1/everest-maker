"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, X, ChevronRight, CheckCircle2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import { proposalsApi, budgetApi, vendorsApi } from "@/lib/api";
import type { ApiProposal } from "@/lib/api";
import type { ProposalStatus, VendorCategory } from "@/lib/types";
import { VENDOR_CATEGORIES } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useAlert } from "@/components/CustomAlert";
import { maskCurrency, parseCurrency } from "@/lib/masks";
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

export default function ProposalsPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();
  const { showConfirm } = useAlert();
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<ProposalStatus | "all">("all");

  const [vendorName, setVendorName] = useState("");
  const [cat, setCat] = useState<VendorCategory>(VENDOR_CATEGORIES[0]);
  const [customCat, setCustomCat] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<ProposalStatus>("negociando");
  const [notes, setNotes] = useState("");

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
    setVendorName("");
    setCat(VENDOR_CATEGORIES[0]);
    setCustomCat("");
    setValue("");
    setStatus("negociando");
    setNotes("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorName.trim() || !value) {
      showToast(
        "Campos obrigatórios",
        "Preencha fornecedor e valor.",
        "warning",
      );
      return;
    }
    const finalCat =
      cat === "Outro" && customCat.trim() ? customCat.trim() : cat;
    const parsedValue = parseCurrency(value);

    try {
      let budgetItemId: string | undefined;
      let vendorId: string | undefined;

      if (status === "fechado") {
        const bi = await budgetApi.create({
          category: finalCat,
          description: vendorName.trim(),
          amount: parsedValue,
          paidAmount: 0,
        });
        budgetItemId = bi.id;
        const v = await vendorsApi.create({
          name: vendorName.trim(),
          category: finalCat,
          value: parsedValue,
          notes: notes.trim() || undefined,
          budgetItemId: bi.id,
        });
        vendorId = v.id;
      }

      await proposalsApi.create({
        vendorName: vendorName.trim(),
        vendorId,
        category: finalCat,
        value: parsedValue,
        status,
        notes: notes.trim() || undefined,
        budgetItemId,
      });
      resetForm();
      setShowAdd(false);
      loadData();
      showToast(
        status === "fechado" ? "🎉 Proposta fechada!" : "Proposta adicionada!",
        status === "fechado" ? "Fornecedor adicionado automaticamente." : "",
        "success",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao adicionar.";
      showToast("Erro", msg, "danger");
    }
  }

  async function handleChangeStatus(id: string, newStatus: ProposalStatus) {
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) return;

    try {
      const updateData: Partial<ApiProposal> = { status: newStatus };

      if (newStatus === "fechado" && proposal.status !== "fechado") {
        const bi = await budgetApi.create({
          category: proposal.category,
          description: proposal.vendorName,
          amount: proposal.value,
          paidAmount: 0,
        });
        updateData.budgetItemId = bi.id;
        const v = await vendorsApi.create({
          name: proposal.vendorName,
          category: proposal.category,
          value: proposal.value,
          notes: proposal.notes,
          budgetItemId: bi.id,
        });
        updateData.vendorId = v.id;
      }

      if (proposal.status === "fechado" && newStatus !== "fechado") {
        if (proposal.budgetItemId) {
          await budgetApi.delete(proposal.budgetItemId);
          updateData.budgetItemId = undefined;
        }
        if (proposal.vendorId) {
          await vendorsApi.delete(proposal.vendorId);
          updateData.vendorId = undefined;
        }
      }

      await proposalsApi.update(id, updateData);
      loadData();
      showToast(
        newStatus === "fechado"
          ? "🎉 Proposta fechada!"
          : `Status: ${STATUS_LABELS[newStatus]}`,
        newStatus === "fechado" ? "Fornecedor adicionado automaticamente." : "",
        newStatus === "fechado" ? "success" : "info",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar.";
      showToast("Erro", msg, "danger");
    }
  }

  function handleDelete(id: string) {
    showConfirm(
      "Remover proposta?",
      "Deseja remover esta proposta e seus vínculos?",
      async () => {
        const p = proposals.find((x) => x.id === id);
        if (p?.budgetItemId) await budgetApi.delete(p.budgetItemId);
        if (p?.vendorId) await vendorsApi.delete(p.vendorId);
        await proposalsApi.delete(id);
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
          onClick={() => setShowAdd(true)}
        >
          <Plus size={15} /> Nova proposta
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
              ? "Nenhuma proposta"
              : `Sem propostas ${STATUS_LABELS[filter as ProposalStatus]?.toLowerCase()}`}
          </p>
          <p className="empty-state__text">
            Registre orçamentos recebidos de fornecedores
          </p>
          {filter === "all" && (
            <button
              className="btn-primary"
              style={{ maxWidth: 220, marginTop: "var(--sp-md)" }}
              onClick={() => setShowAdd(true)}
            >
              Nova proposta
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
              style={{
                borderLeft: `3px solid ${STATUS_BORDER[p.status]}`,
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-sm)",
              }}
            >
              {/* Linha 1: nome + status + delete */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
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
                    {/* Badge indicando que virou fornecedor */}
                    {p.vendorId && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10,
                          color: "var(--color-success)",
                          fontWeight: 600,
                          letterSpacing: 0.5,
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
                    onClick={() => handleDelete(p.id)}
                    style={{
                      color: "var(--color-gray-dark)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      padding: 2,
                      borderRadius: 4,
                      transition: "color 0.15s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--color-danger)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--color-gray-dark)")
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Valor */}
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

              {/* Observações */}
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

              {/* Ações de status */}
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
                      onClick={() => handleChangeStatus(p.id, s)}
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

      {/* ── MODAL ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nova proposta</h2>
              <button
                className="modal-close"
                onClick={() => {
                  resetForm();
                  setShowAdd(false);
                }}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleAdd}
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
                  placeholder="Nome do fornecedor"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
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
                <div className="input-group">
                  <label className="input-label">Valor (R$) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-field"
                    placeholder="R$ 0,00"
                    value={value}
                    onChange={(e) => setValue(maskCurrency(e.target.value))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Status</label>
                <select
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProposalStatus)}
                  style={{
                    background: "var(--color-black-card)",
                    cursor: "pointer",
                  }}
                >
                  <option value="negociando">Negociando</option>
                  <option value="fechado">Fechado</option>
                  <option value="recusado">Recusado</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Observações</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Condições, detalhes do contrato..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Aviso quando status = fechado */}
              {status === "fechado" && (
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
                    Esta proposta será adicionada ao <strong>orçamento</strong>{" "}
                    e o fornecedor será criado automaticamente em{" "}
                    <strong>Fornecedores</strong>.
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
                    resetForm();
                    setShowAdd(false);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar proposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
