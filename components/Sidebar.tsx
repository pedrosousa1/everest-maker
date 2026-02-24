"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  Home,
  Wallet,
  FileText,
  Users,
  CalendarDays,
  ClipboardCheck,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", Icon: Home },
  { href: "/budget", label: "Orçamento", Icon: Wallet },
  { href: "/proposals", label: "Propostas", Icon: FileText },
  { href: "/vendors", label: "Fornecedores", Icon: Users },
  { href: "/agenda", label: "Agenda", Icon: CalendarDays },
  { href: "/checklist", label: "Checklist", Icon: ClipboardCheck },
  { href: "/settings", label: "Configurações", Icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <div
        className={`sidebar-overlay${open ? " open" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar__logo">
          <img
            src="/logo.png"
            alt="Everest Maker"
            style={{ height: 60, margin: "0 auto" }}
          />
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? " active" : ""}`}
                onClick={onClose}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          {user && (
            <div style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-white-muted)",
                  marginBottom: 2,
                }}
              >
                {user.name}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-gray-dark)" }}>
                {user.email}
              </p>
            </div>
          )}
          <button
            className="btn-ghost"
            style={{ width: "100%", justifyContent: "flex-start", gap: 8 }}
            onClick={logout}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}
