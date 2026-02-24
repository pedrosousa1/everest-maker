"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Splash simples: verifica auth e redireciona
    const timer = setTimeout(() => {
      if (isLoggedIn()) {
        router.replace("/dashboard");
      } else {
        router.replace("/welcome");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-black)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow de fundo */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(198,167,94,0.06) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        style={{
          animation: "fadeIn 0.8s ease",
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <img
          src="/logo.png"
          alt="Everest Planner"
          style={{ height: 56, marginBottom: 24 }}
        />

        <div
          style={{
            width: 200,
            height: 1,
            background: "var(--color-gold)",
            opacity: 0.4,
            margin: "0 auto 16px",
            animation: "fadeIn 1s ease 0.3s both",
          }}
        />

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "var(--color-gold)",
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: 0.8,
            animation: "fadeIn 0.8s ease 0.6s both",
          }}
        >
          Planejamento de Casamentos
        </p>
      </div>

      {/* Dots de loading */}
      <div
        style={{
          display: "flex",
          gap: 12,
          zIndex: 1,
          animation: "fadeIn 0.8s ease 0.8s both",
        }}
      >
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-gold)",
              animation: `pulse 1.2s ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
