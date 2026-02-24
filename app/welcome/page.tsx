"use client";

import Link from "next/link";

export default function WelcomePage() {
  return (
    <div
      className="auth-page"
      style={{
        padding: "var(--sp-xl) var(--sp-md)",
        minHeight: "100vh",
        flexDirection: "column",
      }}
    >
      <div className="auth-glow" />

      <div
        style={{ width: "100%", maxWidth: 440, zIndex: 1, textAlign: "center" }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "var(--sp-xl)" }}>
          <img
            src="/logo.png"
            alt="Everest Planner"
            style={{ width: 150, margin: "0 auto 20px" }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: "var(--sp-lg)",
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: "var(--color-gold)",
                textTransform: "uppercase",
                fontWeight: 300,
                margin: "0 auto",
              }}
            >
              Planejando seu casamento
            </span>
          </div>

          <p
            style={{
              fontSize: 16,
              color: "var(--color-white-muted)",
              lineHeight: 1.7,
            }}
          >
            Transformamos o planejamento
            <br />
            do seu casamento em segurança.
          </p>
        </div>

        {/* Stats */}
        <div
          className="card card--gold"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--sp-xl)",
            marginBottom: "var(--sp-xl)",
            padding: "var(--sp-md) var(--sp-lg)",
          }}
        >
          {[
            { n: "3k+", l: "Casamentos" },
            { n: "15+", l: "Anos" },
            { n: "100%", l: "Dedicação" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                display: "flex",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--color-gold)",
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-gray)",
                    letterSpacing: 1,
                    marginTop: 2,
                  }}
                >
                  {s.l}
                </div>
              </div>
              {i < 2 && (
                <div
                  style={{
                    width: 1,
                    background: "var(--color-gold-border)",
                    margin: "0 0 0 var(--sp-xl)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Botões */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-md)",
          }}
        >
          <Link href="/register" className="btn-primary">
            Começar meu planejamento
          </Link>
          <Link href="/login" className="btn-secondary">
            Já tenho uma conta
          </Link>
        </div>
      </div>
    </div>
  );
}
