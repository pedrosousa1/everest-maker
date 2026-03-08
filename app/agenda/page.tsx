"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  X,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
  Handshake,
  ScanSearch,
  Tag,
  Wrench,
  CreditCard,
  UtensilsCrossed,
  Pencil,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import { appointmentsApi } from "@/lib/api";
import type { ApiAppointment } from "@/lib/api";
import type { AppointmentType } from "@/lib/types";
import { APPOINTMENT_TYPES } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useAlert } from "@/components/CustomAlert";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Reunião: <Handshake size={12} />,
  "Visita técnica": <ScanSearch size={12} />,
  Prova: <Tag size={12} />,
  Pagamento: <CreditCard size={12} />,
  Degustação: <UtensilsCrossed size={12} />,
  Outro: <Wrench size={12} />,
};

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const apt = new Date(d);
  apt.setHours(0, 0, 0, 0);

  if (apt.getTime() === today.getTime()) return "Hoje";
  if (apt.getTime() === tomorrow.getTime()) return "Amanhã";

  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function groupByDate(apts: ApiAppointment[]) {
  const groups: Record<string, ApiAppointment[]> = {};
  apts.forEach((a) => {
    const key = new Date(a.date).toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });
  return groups;
}

export default function AgendaPage() {
  const { loading } = useRequireAuth();
  const { showToast } = useToast();
  const { showConfirm } = useAlert();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(APPOINTMENT_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      const a = await appointmentsApi.list();
      setAppointments(a);
    } catch (err) {
      console.error("Agenda load error:", err);
    }
  }, []);
  useEffect(() => {
    loadData();
  }, [loadData]);
  if (loading) return null;

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const filtered =
    filter === "pending"
      ? sorted.filter((a) => !a.completed)
      : filter === "done"
        ? sorted.filter((a) => a.completed)
        : sorted;

  const pending = appointments.filter((a) => !a.completed).length;
  const done = appointments.filter((a) => a.completed).length;
  const grouped = groupByDate(filtered);

  function resetForm() {
    setTitle("");
    setType(APPOINTMENT_TYPES[0]);
    setCustomType("");
    setDate("");
    setTime("");
    setLocation("");
    setNotes("");
    setEditingId(null);
  }

  function openEdit(apt: ApiAppointment) {
    setEditingId(apt.id);
    setTitle(apt.title);
    const knownType = APPOINTMENT_TYPES.includes(apt.type as AppointmentType);
    if (knownType) {
      setType(apt.type);
      setCustomType("");
    } else {
      setType("Outro");
      setCustomType(apt.type);
    }
    setDate(new Date(apt.date).toISOString().slice(0, 10));
    setTime(apt.time);
    setLocation(apt.location || "");
    setNotes(apt.notes || "");
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalType =
      type === "Outro" && customType.trim() ? customType.trim() : type;
    if (!title.trim() || !date || !time) {
      showToast("Preencha título, data e horário.", "", "warning");
      return;
    }
    const isoDate = new Date(date + "T12:00:00").toISOString();
    try {
      if (editingId) {
        await appointmentsApi.update(editingId, {
          title: title.trim(),
          type: finalType,
          date: isoDate,
          time,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        showToast("Compromisso atualizado!", "", "success");
      } else {
        await appointmentsApi.create({
          title: title.trim(),
          type: finalType,
          date: isoDate,
          time,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        showToast("Compromisso adicionado!", "", "success");
      }
      resetForm();
      setShowAdd(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar.";
      showToast("Erro", msg, "danger");
    }
  }

  function toggleDone(apt: ApiAppointment) {
    appointmentsApi
      .update(apt.id, { completed: !apt.completed })
      .then(() => loadData());
  }

  return (
    <AppShell
      title="Agenda"
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
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "var(--sp-sm)",
          marginBottom: "var(--sp-xl)",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { key: "all", label: `Todos (${appointments.length})` },
            { key: "pending", label: `Pendentes (${pending})` },
            { key: "done", label: `Concluídos (${done})` },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
              background:
                filter === f.key
                  ? "var(--color-gold-muted)"
                  : "var(--color-black-card)",
              border: `1px solid ${filter === f.key ? "var(--color-gold)" : "var(--color-black-border)"}`,
              color:
                filter === f.key ? "var(--color-gold)" : "var(--color-gray)",
              transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista agrupada por data */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <CalendarDays size={28} />
          </div>
          <p className="empty-state__title">Nenhum compromisso</p>
          <p className="empty-state__text">
            {filter === "done"
              ? "Nenhum compromisso concluído ainda"
              : filter === "pending"
                ? "Nenhum compromisso pendente"
                : "Adicione reuniões, provas e visitas ao planejamento"}
          </p>
          {filter === "all" && (
            <button
              className="btn-primary"
              style={{ maxWidth: 220, marginTop: "var(--sp-md)" }}
              onClick={() => setShowAdd(true)}
            >
              Adicionar compromisso
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-xl)",
          }}
        >
          {Object.entries(grouped).map(([dateKey, apts]) => {
            const isToday = dateKey === new Date().toISOString().slice(0, 10);
            const isPast =
              new Date(dateKey) <
              new Date(new Date().toISOString().slice(0, 10));
            return (
              <div key={dateKey}>
                {/* Header do grupo */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: "var(--sp-sm)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      flexShrink: 0,
                      textAlign: "center",
                      background: isToday
                        ? "var(--color-gold-muted)"
                        : "var(--color-black-soft)",
                      border: `1px solid ${isToday ? "var(--color-gold)" : "var(--color-black-border)"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isToday
                          ? "var(--color-gold)"
                          : "var(--color-white)",
                      }}
                    >
                      {new Date(dateKey + "T12:00:00").getDate()}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: isToday
                          ? "var(--color-gold)"
                          : "var(--color-gray)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {new Date(dateKey + "T12:00:00").toLocaleString("pt-BR", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isToday
                          ? "var(--color-gold)"
                          : isPast
                            ? "var(--color-gray)"
                            : "var(--color-white-muted)",
                        textTransform: "capitalize",
                      }}
                    >
                      {formatDateHeader(dateKey + "T12:00:00")}
                    </p>
                    <p
                      style={{ fontSize: 11, color: "var(--color-gray-dark)" }}
                    >
                      {apts.length}{" "}
                      {apts.length === 1 ? "compromisso" : "compromissos"}
                    </p>
                  </div>
                </div>

                {/* Compromissos do grupo */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    paddingLeft: 46,
                  }}
                >
                  {apts.map((apt) => {
                    const isOverdue =
                      !apt.completed && new Date(apt.date) < new Date();
                    return (
                      <div
                        key={apt.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "var(--color-black-card)",
                          border: `1px solid ${apt.completed ? "var(--color-black-border)" : isOverdue ? "rgba(239,68,68,0.25)" : "var(--color-black-border)"}`,
                          borderLeft: `3px solid ${apt.completed ? "var(--color-success)" : isOverdue ? "var(--color-danger)" : "var(--color-gold)"}`,
                          borderRadius: "var(--r-md)",
                          padding: "10px 12px",
                          opacity: apt.completed ? 0.55 : 1,
                          transition: "opacity 0.2s, border-color 0.15s",
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleDone(apt)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            flexShrink: 0,
                            color: apt.completed
                              ? "var(--color-success)"
                              : "var(--color-gray-dark)",
                            transition: "color 0.15s",
                            padding: 0,
                          }}
                        >
                          {apt.completed ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Circle size={20} />
                          )}
                        </button>

                        {/* Conteúdo */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "var(--color-white)",
                              textDecoration: apt.completed
                                ? "line-through"
                                : "none",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginBottom: 3,
                            }}
                          >
                            {apt.title}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              className="badge badge--gold"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              {TYPE_ICONS[apt.type]} {apt.type}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: isOverdue
                                  ? "var(--color-danger)"
                                  : "var(--color-gray)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Clock size={10} /> {apt.time}
                            </span>
                            {apt.location && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--color-gray-dark)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: 120,
                                }}
                              >
                                <MapPin size={10} /> {apt.location}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="badge badge--danger">
                                Atrasado
                              </span>
                            )}
                          </div>
                          {apt.notes && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--color-gray-dark)",
                                marginTop: 3,
                                fontStyle: "italic",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {apt.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(apt)}
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
                              (e.currentTarget.style.color =
                                "var(--color-gold)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.color =
                                "var(--color-gray-dark)")
                            }
                          >
                            <Pencil size={13} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => {
                              showConfirm(
                                "Remover compromisso?",
                                `Deseja remover "${apt.title}"?`,
                                async () => {
                                  await appointmentsApi.delete(apt.id);
                                  loadData();
                                },
                                "Remover",
                                "danger",
                              );
                            }}
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
                              (e.currentTarget.style.color =
                                "var(--color-danger)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.color =
                                "var(--color-gray-dark)")
                            }
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? "Editar compromisso" : "Novo compromisso"}
              </h2>
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
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Título */}
              <div className="input-group">
                <label className="input-label">Título *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Reunião com buffet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Tipo */}
              <div className="input-group">
                <label className="input-label">Tipo</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {APPOINTMENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        cursor: "pointer",
                        fontWeight: 500,
                        background:
                          type === t
                            ? "var(--color-gold-muted)"
                            : "var(--color-black-soft)",
                        border: `1px solid ${type === t ? "var(--color-gold)" : "var(--color-black-border)"}`,
                        color:
                          type === t
                            ? "var(--color-gold)"
                            : "var(--color-gray)",
                        transition: "all 0.15s",
                      }}
                    >
                      {TYPE_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
                {type === "Outro" && (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Especifique o tipo..."
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              {/* Data + Hora */}
              <div className="input-group">
                <label className="input-label">Data *</label>
                <input
                  type="date"
                  className="input-field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Horário *</label>
                <input
                  type="time"
                  className="input-field"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              {/* Local */}
              <div className="input-group">
                <label className="input-label">Local</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Buffet Elegance"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Observações */}
              <div className="input-group">
                <label className="input-label">Observações</label>
                <textarea
                  className="input-field"
                  placeholder="O que levar, agenda do encontro..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
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
