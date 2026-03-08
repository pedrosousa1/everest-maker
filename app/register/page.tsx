"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { setAuthenticated } = useAuth();
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      showToast(
        "Campos obrigatórios",
        "Preencha todos os campos para continuar.",
        "warning",
      );
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      showToast(
        "E-mail inválido",
        "Digite um endereço de e-mail válido.",
        "warning",
      );
      return;
    }
    if (password.length < 6) {
      showToast(
        "Senha fraca",
        "A senha deve ter pelo menos 6 caracteres.",
        "warning",
      );
      return;
    }
    if (password !== confirmPassword) {
      showToast(
        "Senhas diferentes",
        "A senha e a confirmação não coincidem.",
        "warning",
      );
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        partnerName: partnerName.trim() || undefined,
      });
      setAuthenticated(user, token);
      router.replace("/setup-wedding");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta.";
      showToast("Erro", msg, "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <img src="/logo.png" alt="Everest Planner" style={{ height: 80 }} />
        </div>

        <h1 className="auth-title">Crie sua conta</h1>
        <p className="auth-subtitle">
          Comece a planejar o casamento dos seus sonhos com organização e
          clareza.
        </p>

        <div className="gold-line" />

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Seu nome *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Maria Oliveira"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Nome do(a) parceiro(a)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: João Silva"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">E-mail *</label>
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
            <label className="input-label">Senha *</label>
            <input
              type="password"
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Confirmar senha *</label>
            <input
              type="password"
              className="input-field"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: "var(--sp-md)" }}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
