"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  Plus,
  X,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import { checklistApi, weddingApi } from "@/lib/api";
import type { ApiChecklistItem } from "@/lib/api";
import { DEFAULT_CHECKLIST } from "@/lib/types";
import { useToast } from "@/components/Toast";

const PERIOD_LABELS: Record<number, string> = {
  12: "12 meses antes",
  9: "9 meses antes",
  6: "6 meses antes",
  4: "4 meses antes",
  3: "3 meses antes",
  2: "2 meses antes",
  1: "1 mês antes",
  0: "Semana do casamento",
};

function getMonthsBefore(weddingDate: string): number {
  const today = new Date();
  const wedding = new Date(weddingDate);
  const diffMs = wedding.getTime() - today.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
}

export default function ChecklistPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ApiChecklistItem[]>([]);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPeriod, setNewPeriod] = useState<number>(1);
  const [monthsLeft, setMonthsLeft] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      let stored = await checklistApi.list();

      // Se está vazio, inicializa com o checklist padrão via API
      if (stored.length === 0) {
        const initial: ApiChecklistItem[] = DEFAULT_CHECKLIST.map((t) => ({
          id: crypto.randomUUID(),
          title: t.title,
          monthsBefore: t.monthsBefore,
          completed: false,
          isCustom: false,
        }));
        stored = await checklistApi.saveAll(initial);
      }
      setItems(stored);

      const w = await weddingApi.get();
      if (w?.weddingDate) {
        setMonthsLeft(getMonthsBefore(w.weddingDate));
      }
    } catch (err) {
      console.error("Checklist load error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return null;

  const periods = [12, 9, 6, 4, 3, 2, 1, 0];

  function toggleItem(id: string) {
    const updated = items.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i,
    );
    setItems(updated);
    checklistApi.saveAll(updated).catch(console.error);
  }

  function deleteItem(id: string) {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    checklistApi.saveAll(updated).catch(console.error);
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Digite um título para a tarefa.", "", "warning");
      return;
    }
    try {
      const newItem = await checklistApi.addCustom({
        title: newTitle.trim(),
        monthsBefore: newPeriod,
      });
      setItems((prev) => [...prev, newItem]);
      setNewTitle("");
      setShowAddForm(false);
      showToast("Tarefa adicionada!", "", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao adicionar.";
      showToast("Erro", msg, "danger");
    }
  }

  function toggleCollapse(period: number) {
    setCollapsed((p) => ({ ...p, [period]: !p[period] }));
  }

  const totalDone = items.filter((i) => i.completed).length;
  const totalPct =
    items.length > 0 ? Math.round((totalDone / items.length) * 100) : 0;

  return (
    <AppShell
      title="Checklist"
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
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={15} /> Adicionar tarefa
        </button>
      }
    >
      {/* Progresso geral */}
      <div
        className="card"
        style={{
          marginBottom: "var(--sp-xl)",
          animation: "fadeInScale 0.4s ease-out both",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardCheck size={16} color="var(--color-gold)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              Progresso geral
            </span>
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-gold)",
            }}
          >
            {totalPct}%
          </span>
        </div>

        <div
          style={{
            height: 6,
            background: "var(--color-black-border)",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${totalPct}%`,
              background:
                totalPct === 100 ? "var(--color-success)" : "var(--color-gold)",
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: "var(--color-gray)" }}>
            {totalDone} de {items.length} tarefas concluídas
          </p>
          {monthsLeft !== null && (
            <p style={{ fontSize: 12, color: "var(--color-gray)" }}>
              {monthsLeft === 0
                ? "Semana do casamento! 🎉"
                : `${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"} até o casamento`}
            </p>
          )}
        </div>
      </div>

      {/* Grupos por período */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-lg)",
        }}
      >
        {periods.map((period) => {
          const periodItems = items.filter((i) => i.monthsBefore === period);
          if (periodItems.length === 0) return null;

          const donePeriod = periodItems.filter((i) => i.completed).length;
          const isCollapsed = collapsed[period];
          const isUrgent =
            monthsLeft !== null && monthsLeft <= period && period > 0;
          const isDone = donePeriod === periodItems.length;

          return (
            <div key={period}>
              {/* Header do grupo */}
              <button
                onClick={() => toggleCollapse(period)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 3,
                      height: 16,
                      borderRadius: 99,
                      background: isDone
                        ? "var(--color-success)"
                        : isUrgent
                          ? "var(--color-danger)"
                          : "var(--color-gold)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isDone
                        ? "var(--color-gray)"
                        : "var(--color-white-muted)",
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {PERIOD_LABELS[period] ?? `${period} meses antes`}
                  </span>
                  {isUrgent && !isDone && (
                    <span
                      className="badge badge--danger"
                      style={{ fontSize: 10 }}
                    >
                      Urgente
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: isDone
                        ? "var(--color-success)"
                        : "var(--color-gray-dark)",
                    }}
                  >
                    {donePeriod}/{periodItems.length}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown size={14} color="var(--color-gray-dark)" />
                  ) : (
                    <ChevronUp size={14} color="var(--color-gray-dark)" />
                  )}
                </div>
              </button>

              {/* Itens do período */}
              {!isCollapsed && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {periodItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "var(--color-black-card)",
                        border: `1px solid ${item.completed ? "var(--color-black-border)" : "var(--color-black-border)"}`,
                        borderLeft: `3px solid ${item.completed ? "var(--color-success)" : "var(--color-gold)"}`,
                        borderRadius: "var(--r-md)",
                        padding: "10px 12px",
                        opacity: item.completed ? 0.6 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          flexShrink: 0,
                          color: item.completed
                            ? "var(--color-success)"
                            : "var(--color-gray-dark)",
                          padding: 0,
                          transition: "color 0.15s",
                        }}
                      >
                        {item.completed ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>

                      <p
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: "var(--color-white)",
                          textDecoration: item.completed
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {item.title}
                        {item.isCustom && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--color-gray-dark)",
                              marginLeft: 6,
                              fontStyle: "italic",
                            }}
                          >
                            personalizado
                          </span>
                        )}
                      </p>

                      {item.isCustom && (
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            padding: 4,
                            borderRadius: 4,
                            color: "var(--color-gray-dark)",
                            transition: "color 0.15s",
                            flexShrink: 0,
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.color =
                              "var(--color-danger)")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.color =
                              "var(--color-gray-dark)")
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: adicionar tarefa personalizada */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Nova tarefa</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setNewTitle("");
                  setShowAddForm(false);
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleAddCustom}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div className="input-group">
                <label className="input-label">Título da tarefa *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Contratar fotógrafo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Período</label>
                <select
                  className="input-field"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(Number(e.target.value))}
                  style={{
                    background: "var(--color-black-card)",
                    cursor: "pointer",
                  }}
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {PERIOD_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setNewTitle("");
                    setShowAddForm(false);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
