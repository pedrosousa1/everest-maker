"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  Users,
  CalendarDays,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/lib/AuthContext";
import {
  getWedding,
  getUser,
  getBudgetItems,
  getVendors,
  getAppointments,
  formatCurrency,
} from "@/lib/storage";
import type {
  WeddingData,
  BudgetItem,
  Vendor,
  Appointment,
  User,
} from "@/lib/types";

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/^(\p{L})/u, (c) => c.toUpperCase());
}

function getDaysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function getBudgetStatus(spent: number, total: number) {
  if (total === 0)
    return {
      color: "var(--color-gray)",
      label: "Orçamento não definido",
      Icon: Minus,
    };
  const pct = (spent / total) * 100;
  if (pct < 80)
    return {
      color: "var(--color-success)",
      label: "Dentro do orçamento",
      Icon: TrendingUp,
    };
  if (pct < 100)
    return { color: "var(--color-warning)", label: "No limite", Icon: Minus };
  return {
    color: "var(--color-danger)",
    label: "Orçamento estourado",
    Icon: TrendingDown,
  };
}

function LoadingDots() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-black)",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        {[0, 150, 300].map((d) => (
          <div
            key={d}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--color-gold)",
              animation: `pulse 1.2s ease-in-out ${d}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { loading } = useRequireAuth();
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadData = useCallback(() => {
    setWedding(getWedding());
    setUser(getUser());
    setBudgetItems(getBudgetItems());
    setVendors(getVendors());
    setAppointments(getAppointments());
  }, []);
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingDots />;

  const totalSpent = budgetItems.reduce((a, i) => a + i.amount, 0);
  const totalBudget = wedding?.totalBudget ?? 0;
  const budgetPct =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const budgetInfo = getBudgetStatus(totalSpent, totalBudget);
  const daysLeft = wedding?.weddingDate
    ? getDaysUntil(wedding.weddingDate)
    : null;

  const upcomingApts = appointments
    .filter((a) => !a.completed && new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const firstName = toTitleCase(user?.name?.split(" ")[0] || "noivos");
  const partnerFirst = user?.partnerName?.trim()
    ? toTitleCase(user.partnerName.split(" ")[0])
    : null;
  const coupleLabel = partnerFirst
    ? `${firstName} & ${partnerFirst}`
    : firstName;

  return (
    <AppShell title="Início">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-xl)",
        }}
      >
        {/* ── HERO HEADER ── */}
        <div
          style={{
            background: "linear-gradient(160deg, #151515 0%, #0B0B0B 100%)",
            borderRadius: "var(--r-xl)",
            padding: "clamp(24px, 5vw, 36px)",
            position: "relative",
            overflow: "hidden",
            animation: "fadeInScale 0.5s ease-out both",
          }}
        >
          {/* Subtle ambient glow */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              background:
                "radial-gradient(circle, rgba(198,167,94,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Label */}
          <p
            style={{
              fontSize: 10,
              color: "var(--color-gold)",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 500,
              opacity: 0.7,
              marginBottom: 6,
            }}
          >
            Seu Planejamento
          </p>

          {/* Couple name */}
          <h2
            style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              fontWeight: 700,
              color: "var(--color-gold)",
              lineHeight: 1.2,
              marginBottom: "clamp(20px, 3vw, 28px)",
            }}
          >
            {coupleLabel}
          </h2>

          {daysLeft !== null ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(16px, 3vw, 20px)",
                animation: "fadeInScale 0.4s 0.15s ease-out both",
              }}
            >
              {/* Countdown */}
              <div>
                {daysLeft > 0 ? (
                  <>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--color-gray)",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      {daysLeft > 1 ? "Faltam" : "Falta"}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "clamp(40px, 10vw, 56px)",
                          fontWeight: 800,
                          color: "var(--color-gold)",
                          lineHeight: 1,
                          letterSpacing: -2,
                        }}
                      >
                        {daysLeft}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(14px, 2vw, 16px)",
                          color: "var(--color-gold)",
                          opacity: 0.5,
                          fontWeight: 500,
                        }}
                      >
                        {daysLeft === 1 ? "dia" : "dias"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "clamp(12px, 2vw, 14px)",
                        color: "var(--color-white-muted)",
                        marginTop: 6,
                      }}
                    >
                      para o grande dia
                    </p>
                  </>
                ) : daysLeft === 0 ? (
                  <div>
                    <p
                      style={{
                        fontSize: "clamp(24px, 5vw, 32px)",
                        fontWeight: 800,
                        color: "var(--color-gold)",
                      }}
                    >
                      É hoje!
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--color-white-muted)",
                        marginTop: 4,
                      }}
                    >
                      O grande dia chegou
                    </p>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--color-gray)",
                    }}
                  >
                    Casamento realizado
                  </p>
                )}
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, rgba(198,167,94,0.2) 0%, transparent 100%)",
                }}
              />

              {/* Info chips */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: wedding?.venueName
                    ? "repeat(auto-fit, minmax(140px, 1fr))"
                    : "1fr",
                  gap: "var(--sp-sm)",
                  minWidth: 0,
                }}
              >
                {/* Data */}
                <div
                  style={{
                    background: "rgba(198,167,94,0.05)",
                    border: "1px solid rgba(198,167,94,0.10)",
                    borderRadius: "var(--r-lg)",
                    padding: "clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    overflow: "hidden",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(198,167,94,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={14} color="var(--color-gold)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 9,
                        color: "var(--color-gray)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 2,
                        fontWeight: 500,
                      }}
                    >
                      Data
                    </p>
                    <p
                      style={{
                        fontSize: "clamp(12px, 2vw, 14px)",
                        fontWeight: 600,
                        color: "var(--color-white)",
                        lineHeight: 1.4,
                      }}
                    >
                      {new Date(wedding!.weddingDate).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                {/* Local */}
                {wedding?.venueName && (
                  <div
                    style={{
                      background: "rgba(198,167,94,0.05)",
                      border: "1px solid rgba(198,167,94,0.10)",
                      borderRadius: "var(--r-lg)",
                      padding:
                        "clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      overflow: "hidden",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(198,167,94,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={14} color="var(--color-gold)" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 9,
                          color: "var(--color-gray)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 2,
                          fontWeight: 500,
                        }}
                      >
                        Local
                      </p>
                      <p
                        style={{
                          fontSize: "clamp(12px, 2vw, 14px)",
                          fontWeight: 600,
                          color: "var(--color-white)",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        {wedding.venueName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/setup-wedding"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: "rgba(198,167,94,0.06)",
                border: "1px solid rgba(198,167,94,0.15)",
                borderRadius: "var(--r-lg)",
                padding: "var(--sp-lg)",
                color: "var(--color-gold)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Sparkles size={16} /> Configure a data do casamento
              <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* ── ORÇAMENTO ── */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--sp-md)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Wallet size={16} color="var(--color-gold)" /> Orçamento
            </h3>
            <Link
              href="/budget"
              style={{
                fontSize: 13,
                color: "var(--color-gold)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Ver tudo <ChevronRight size={13} />
            </Link>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "var(--sp-md)",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-gray)",
                    marginBottom: 2,
                  }}
                >
                  Total definido
                </p>
                <p style={{ fontSize: 22, fontWeight: 700 }}>
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-gray)",
                    marginBottom: 2,
                  }}
                >
                  Investido
                </p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--color-gold)",
                  }}
                >
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-sm)",
                marginBottom: "var(--sp-sm)",
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
                    width: `${budgetPct}%`,
                    background: budgetInfo.color,
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
                {budgetPct.toFixed(0)}%
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <budgetInfo.Icon size={14} color={budgetInfo.color} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: budgetInfo.color,
                }}
              >
                {budgetInfo.label}
              </span>
            </div>
          </div>
        </section>

        {/* ── STATS GRID ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--sp-md)",
          }}
        >
          {[
            {
              href: "/vendors",
              Icon: Users,
              count: vendors.length,
              label: "Fornecedores",
              sub: `${vendors.length === 1 ? "cadastrado" : "cadastrados"}`,
            },
            {
              href: "/agenda",
              Icon: CalendarDays,
              count: appointments.filter((a) => !a.completed).length,
              label: "Pendentes",
              sub: `${appointments.filter((a) => a.completed).length} concluídos`,
            },
          ].map(({ href, Icon, count, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="card"
              style={{
                cursor: "pointer",
                textDecoration: "none",
                transition: "border-color 0.15s",
                textAlign: "center",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-gold-border)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor =
                  "var(--color-black-border)")
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "var(--sp-sm)",
                }}
              >
                <Icon size={28} color="var(--color-gold)" />
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, margin: "4px 0" }}>
                {count}
              </p>
              <p style={{ fontSize: 13, color: "var(--color-gray)" }}>
                {label}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--color-gray-dark)",
                  marginTop: 4,
                }}
              >
                {sub}
              </p>
            </Link>
          ))}
        </div>

        {/* ── PRÓXIMOS COMPROMISSOS ── */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--sp-md)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CalendarDays size={16} color="var(--color-gold)" /> Próximos
              compromissos
            </h3>
            <Link
              href="/agenda"
              style={{
                fontSize: 13,
                color: "var(--color-gold)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Ver agenda <ChevronRight size={13} />
            </Link>
          </div>

          {upcomingApts.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: "center", padding: "var(--sp-xl)" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <CalendarDays size={32} color="var(--color-gray-dark)" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Nenhum compromisso agendado
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-gray)",
                  marginBottom: 16,
                }}
              >
                Adicione compromissos na sua agenda
              </p>
              <Link
                href="/agenda"
                className="btn-primary"
                style={{ maxWidth: 220, margin: "0 auto" }}
              >
                Adicionar compromisso
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-sm)",
              }}
            >
              {upcomingApts.map((apt) => (
                <div
                  key={apt.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-md)",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--color-gold)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {apt.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--color-gray)",
                        marginTop: 2,
                      }}
                    >
                      {new Date(apt.date).toLocaleDateString("pt-BR")} às{" "}
                      {apt.time}
                    </p>
                  </div>
                  <span className="badge badge--gold" style={{ flexShrink: 0 }}>
                    {apt.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
