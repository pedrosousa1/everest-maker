"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AppShell({ title, children, actions }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="topbar">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-md)",
            }}
          >
            {/* Hamburger — só visível no mobile */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <span />
              <span />
              <span />
            </button>
            <h1 className="topbar__title">{title}</h1>
          </div>
          {actions && (
            <div style={{ display: "flex", gap: "var(--sp-sm)" }}>
              {actions}
            </div>
          )}
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
