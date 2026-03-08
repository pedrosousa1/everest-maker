// ════════════════════════════════════
// lib/api.ts — Cliente HTTP para o backend
// Everest Planner API
// ════════════════════════════════════

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ── Token storage ──────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("@everest:token");
}

export function setToken(token: string): void {
  localStorage.setItem("@everest:token", token);
}

export function removeToken(): void {
  localStorage.removeItem("@everest:token");
}

// ── Fetch helper ───────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }

  return data as T;
}

// ── Helpers ────────────────────────────
function get<T>(path: string) {
  return request<T>(path, { method: "GET" });
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

function del<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

// ════════════════════════════════════
// AUTH
// ════════════════════════════════════

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  partnerName?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    partnerName?: string;
  }) => post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    post<AuthResponse>("/auth/login", data),

  me: () => get<ApiUser>("/auth/me"),

  updateMe: (data: {
    name?: string;
    partnerName?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => put<ApiUser>("/auth/me", data),
};

// ════════════════════════════════════
// WEDDING
// ════════════════════════════════════

export interface ApiWedding {
  id: string;
  coupleName: string;
  weddingDate?: string;
  venueName?: string;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
}

export const weddingApi = {
  get: () => get<ApiWedding | null>("/wedding"),
  create: (data: Partial<ApiWedding>) => post<ApiWedding>("/wedding", data),
  update: (data: Partial<ApiWedding>) => put<ApiWedding>("/wedding", data),
};

// ════════════════════════════════════
// BUDGET ITEMS
// ════════════════════════════════════

export interface ApiBudgetItem {
  id: string;
  weddingId: string;
  category: string;
  description: string;
  amount: number;
  paidAmount: number;
  createdAt: string;
}

export const budgetApi = {
  list: () => get<ApiBudgetItem[]>("/budget-items"),
  create: (data: Omit<ApiBudgetItem, "id" | "weddingId" | "createdAt">) =>
    post<ApiBudgetItem>("/budget-items", data),
  update: (id: string, data: Partial<ApiBudgetItem>) =>
    put<ApiBudgetItem>(`/budget-items/${id}`, data),
  delete: (id: string) => del<{ ok: boolean }>(`/budget-items/${id}`),
};

// ════════════════════════════════════
// VENDORS
// ════════════════════════════════════

export interface ApiVendor {
  id: string;
  weddingId: string;
  name: string;
  category: string;
  value?: number;
  phone?: string;
  email?: string;
  instagram?: string;
  notes?: string;
  budgetItemId?: string;
  createdAt: string;
}

export const vendorsApi = {
  list: () => get<ApiVendor[]>("/vendors"),
  create: (data: Omit<ApiVendor, "id" | "weddingId" | "createdAt">) =>
    post<ApiVendor>("/vendors", data),
  update: (id: string, data: Partial<ApiVendor>) =>
    put<ApiVendor>(`/vendors/${id}`, data),
  delete: (id: string) => del<{ ok: boolean }>(`/vendors/${id}`),
};

// ════════════════════════════════════
// PROPOSALS
// ════════════════════════════════════

export interface ApiProposal {
  id: string;
  weddingId: string;
  vendorName: string;
  vendorId?: string;
  category: string;
  value: number;
  status: "negociando" | "fechado" | "recusado";
  notes?: string;
  budgetItemId?: string;
  ratingPrice?: number;
  ratingTrust?: number;
  ratingQuality?: number;
  ratingService?: number;
  createdAt: string;
}

export const proposalsApi = {
  list: () => get<ApiProposal[]>("/proposals"),
  create: (data: Omit<ApiProposal, "id" | "weddingId" | "createdAt">) =>
    post<ApiProposal>("/proposals", data),
  update: (id: string, data: Partial<ApiProposal>) =>
    put<ApiProposal>(`/proposals/${id}`, data),
  delete: (id: string) => del<{ ok: boolean }>(`/proposals/${id}`),
};

// ════════════════════════════════════
// APPOINTMENTS
// ════════════════════════════════════

export interface ApiAppointment {
  id: string;
  weddingId: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export const appointmentsApi = {
  list: () => get<ApiAppointment[]>("/appointments"),
  create: (
    data: Omit<ApiAppointment, "id" | "weddingId" | "createdAt" | "completed">,
  ) => post<ApiAppointment>("/appointments", data),
  update: (id: string, data: Partial<ApiAppointment>) =>
    put<ApiAppointment>(`/appointments/${id}`, data),
  delete: (id: string) => del<{ ok: boolean }>(`/appointments/${id}`),
};

// ════════════════════════════════════
// CHECKLIST
// ════════════════════════════════════

export interface ApiChecklistItem {
  id: string;
  title: string;
  monthsBefore: number;
  completed: boolean;
  isCustom?: boolean;
}

export const checklistApi = {
  list: () => get<ApiChecklistItem[]>("/checklist"),
  saveAll: (items: ApiChecklistItem[]) =>
    put<ApiChecklistItem[]>("/checklist", { items }),
  addCustom: (data: { title: string; monthsBefore: number }) =>
    post<ApiChecklistItem>("/checklist", data),
  delete: (id: string) => del<{ ok: boolean }>(`/checklist/${id}`),
};
