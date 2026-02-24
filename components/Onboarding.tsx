"use client";

import { useRef, useState } from "react";
import {
  Wallet,
  Users,
  CalendarDays,
  ClipboardCheck,
  FileText,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const SLIDES = [
  {
    icon: <Sparkles size={32} />,
    title: "Bem-vindo ao Everest Planner",
    subtitle: "Seu planejamento de casamento num só lugar",
    description:
      "Chega de planilhas confusas, anotações espalhadas e perda de controle. O Everest Planner foi feito para simplificar cada etapa do seu grande dia.",
    color: "var(--color-gold)",
    bg: "rgba(198, 167, 94, 0.08)",
  },
  {
    icon: <Wallet size={32} />,
    title: "Orçamento sob controle",
    subtitle: "Saiba exatamente quanto já investiu",
    description:
      "Acompanhe todos os gastos, registre pagamentos parciais, e veja em tempo real quanto do orçamento já foi utilizado. Sem surpresas no final.",
    color: "#4caf50",
    bg: "rgba(76, 175, 80, 0.08)",
  },
  {
    icon: <Users size={32} />,
    title: "Fornecedores organizados",
    subtitle: "Todos os contatos e valores reunidos",
    description:
      "Cadastre fornecedores com telefone, Instagram e valor contratado. Tudo integrado automaticamente com o orçamento — sem retrabalho.",
    color: "#42a5f5",
    bg: "rgba(66, 165, 245, 0.08)",
  },
  {
    icon: <FileText size={32} />,
    title: "Propostas e negociações",
    subtitle: "Compare e feche os melhores contratos",
    description:
      "Gerencie propostas de fornecedores, compare valores, e ao fechar um contrato o fornecedor e o gasto são registrados automaticamente.",
    color: "#ab47bc",
    bg: "rgba(171, 71, 188, 0.08)",
  },
  {
    icon: <CalendarDays size={32} />,
    title: "Agenda inteligente",
    subtitle: "Nunca perca um compromisso",
    description:
      "Agende visitas, degustações e reuniões com fornecedores. Veja tudo no calendário e receba alertas de compromissos próximos.",
    color: "#ff9800",
    bg: "rgba(255, 152, 0, 0.08)",
  },
  {
    icon: <ClipboardCheck size={32} />,
    title: "Checklist completo",
    subtitle: "33 tarefas essenciais pré-prontas",
    description:
      "Do contrato do espaço à playlist da festa — um checklist completo organizado por período para você não esquecer de nada.",
    color: "#26a69a",
    bg: "rgba(38, 166, 154, 0.08)",
  },
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [current, setCurrent] = useState(0);
  const directionRef = useRef<"next" | "prev">("next");
  const animatingRef = useRef(false);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  function goTo(idx: number) {
    if (animatingRef.current) return;
    // Atualiza a ref de direção ANTES de qualquer setState
    directionRef.current = idx > current ? "next" : "prev";
    animatingRef.current = true;
    // Muda o slide imediatamente — a ref já tem a direção certa
    setCurrent(idx);
    setTimeout(() => {
      animatingRef.current = false;
    }, 350);
  }

  function next() {
    if (isLast) {
      onFinish();
    } else {
      goTo(current + 1);
    }
  }

  function prev() {
    if (current > 0) goTo(current - 1);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(12px)",
        animation: "ob-fadeIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 16px",
          background: "var(--color-black-card)",
          border: "1px solid var(--color-black-border)",
          borderRadius: "var(--r-xl)",
          overflow: "hidden",
          animation: "ob-scaleIn 0.4s ease-out both",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Progress dots ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            padding: "20px 24px 0",
          }}
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background:
                  i === current ? slide.color : "var(--color-black-border)",
              }}
            />
          ))}
        </div>

        {/* ── Slide content ── */}
        <div
          key={current}
          style={{
            padding: "32px 32px 24px",
            textAlign: "center",
            animation: `${directionRef.current === "next" ? "ob-slideFromRight" : "ob-slideFromLeft"} 0.35s ease-out`,
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: slide.bg,
              border: `1px solid ${slide.color}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: slide.color,
              marginBottom: 24,
              boxShadow: `0 0 40px ${slide.color}15`,
            }}
          >
            {slide.icon}
          </div>

          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-white)",
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {slide.title}
          </h2>

          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: slide.color,
              marginBottom: 16,
              letterSpacing: 0.3,
            }}
          >
            {slide.subtitle}
          </p>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--color-gray)",
              maxWidth: 380,
            }}
          >
            {slide.description}
          </p>
        </div>

        {/* ── Action bar ── */}
        <div
          style={{
            padding: "0 32px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: isLast ? "center" : "space-between",
            gap: 12,
          }}
        >
          {!isLast && (
            <button
              onClick={prev}
              disabled={current === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                color: current === 0 ? "transparent" : "var(--color-gray)",
                cursor: current === 0 ? "default" : "pointer",
                fontSize: 13,
                fontWeight: 500,
                padding: "8px 4px",
                transition: "color 0.15s",
                fontFamily: "var(--font)",
              }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
          )}

          {!isLast && (
            <span
              style={{
                fontSize: 12,
                color: "var(--color-gray-dark)",
                fontWeight: 500,
              }}
            >
              {current + 1} / {SLIDES.length}
            </span>
          )}

          <button
            onClick={next}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: isLast ? "12px 32px" : "8px 4px",
              background: isLast
                ? "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))"
                : "none",
              border: "none",
              borderRadius: isLast ? 10 : 0,
              color: isLast ? "var(--color-black)" : "var(--color-gold)",
              cursor: "pointer",
              fontSize: isLast ? 15 : 13,
              fontWeight: isLast ? 700 : 500,
              transition: "all 0.2s ease",
              fontFamily: "var(--font)",
              boxShadow: isLast ? "0 4px 16px rgba(198,167,94,0.3)" : "none",
            }}
          >
            {isLast ? (
              <>
                Vamos começar! <ArrowRight size={16} />
              </>
            ) : (
              <>
                Próximo <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ob-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ob-scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ob-slideFromRight {
          from { opacity: 0; transform: translateX(48px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes ob-slideFromLeft {
          from { opacity: 0; transform: translateX(-48px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
