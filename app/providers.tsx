"use client";

import { AuthProvider } from "@/lib/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { AlertProvider } from "@/components/CustomAlert";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AlertProvider>
        <ToastProvider>{children}</ToastProvider>
      </AlertProvider>
    </AuthProvider>
  );
}
