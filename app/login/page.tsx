"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, setLoggedIn } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { setAuthenticated } = useAuth();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Campos obrigatórios", "Preencha e-mail e senha.", "warning");
      return;
    }
    setLoading(true);
    try {
      const user = getUser();
      if (user && user.email === email.trim().toLowerCase()) {
        setLoggedIn(true);
        setAuthenticated(); // atualiza contexto imediatamente
        router.replace("/dashboard");
      } else {
        showToast(
          "Conta não encontrada",
          "Verifique seu e-mail ou crie uma conta.",
          "danger",
        );
      }
    } catch {
      showToast(
        "Erro ao entrar",
        "Não foi possível fazer login. Tente novamente.",
        "danger",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Everest Planner" style={{ height: 80 }} />
        </div>

        <h1 className="auth-title">Bem-vindo de volta</h1>
        <p className="auth-subtitle">
          Entre na sua conta para continuar o seu planejamento.
        </p>

        <div className="gold-line" />

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">E-mail</label>
            <input
              type="email"
              className="input-field"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Senha</label>
            <input
              type="password"
              className="input-field"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Entrando..." : "Entrar na minha conta"}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: "var(--sp-md)" }}>
          Ainda não tem conta? <Link href="/register">Criar agora</Link>
        </p>
      </div>
    </div>
  );
}
