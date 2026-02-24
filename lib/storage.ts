// ════════════════════════════════════
// STORAGE — localStorage (web)
// Mesma API do storage.ts original
// ════════════════════════════════════

import type {
  User,
  WeddingData,
  BudgetItem,
  Vendor,
  Proposal,
  Appointment,
  ChecklistItem,
} from "./types";

const KEYS = {
  USER: "@everest:user",
  WEDDING: "@everest:wedding",
  BUDGET_ITEMS: "@everest:budget_items",
  VENDORS: "@everest:vendors",
  PROPOSALS: "@everest:proposals",
  APPOINTMENTS: "@everest:appointments",
  CHECKLIST: "@everest:checklist",
  IS_LOGGED_IN: "@everest:is_logged_in",
  ONBOARDING_DONE: "@everest:onboarding_done",
};

function get<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function set(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

// ── ID Generator ──────────────────────
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ── USER ──────────────────────────────
export function saveUser(user: User): void {
  set(KEYS.USER, user);
}
export function getUser(): User | null {
  return get<User>(KEYS.USER);
}
export function setLoggedIn(v: boolean): void {
  localStorage.setItem(KEYS.IS_LOGGED_IN, v ? "true" : "false");
}
export function isLoggedIn(): boolean {
  return localStorage.getItem(KEYS.IS_LOGGED_IN) === "true";
}
export function logout(): void {
  remove(KEYS.IS_LOGGED_IN);
}

// ── ONBOARDING ────────────────────────
export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(KEYS.ONBOARDING_DONE) === "true";
}
export function setOnboardingDone(): void {
  localStorage.setItem(KEYS.ONBOARDING_DONE, "true");
}

// ── WEDDING ───────────────────────────
export function saveWedding(w: WeddingData): void {
  set(KEYS.WEDDING, w);
}
export function getWedding(): WeddingData | null {
  return get<WeddingData>(KEYS.WEDDING);
}

// ── BUDGET ITEMS ──────────────────────
export function getBudgetItems(): BudgetItem[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = get<any[]>(KEYS.BUDGET_ITEMS) ?? [];
  return items.map((i) => ({
    ...i,
    paidAmount:
      typeof i.paidAmount === "number"
        ? i.paidAmount
        : i.paid === true
          ? i.amount
          : 0,
  }));
}
export function saveBudgetItems(items: BudgetItem[]): void {
  set(KEYS.BUDGET_ITEMS, items);
}
export function addBudgetItem(item: BudgetItem): void {
  const items = getBudgetItems();
  items.push(item);
  saveBudgetItems(items);
}
export function deleteBudgetItem(id: string): void {
  saveBudgetItems(getBudgetItems().filter((i) => i.id !== id));
}
export function updateBudgetItem(updated: BudgetItem): void {
  saveBudgetItems(
    getBudgetItems().map((i) => (i.id === updated.id ? updated : i)),
  );
}

// ── VENDORS ───────────────────────────
export function getVendors(): Vendor[] {
  return get<Vendor[]>(KEYS.VENDORS) ?? [];
}
export function saveVendors(vendors: Vendor[]): void {
  set(KEYS.VENDORS, vendors);
}
export function addVendor(vendor: Vendor): void {
  const vendors = getVendors();
  vendors.push(vendor);
  saveVendors(vendors);
}
export function deleteVendor(id: string): void {
  saveVendors(getVendors().filter((v) => v.id !== id));
}
export function updateVendor(updated: Vendor): void {
  saveVendors(getVendors().map((v) => (v.id === updated.id ? updated : v)));
}

// ── PROPOSALS ─────────────────────────
export function getProposals(): Proposal[] {
  return get<Proposal[]>(KEYS.PROPOSALS) ?? [];
}
export function saveProposals(proposals: Proposal[]): void {
  set(KEYS.PROPOSALS, proposals);
}
export function addProposal(proposal: Proposal): void {
  const proposals = getProposals();
  proposals.push(proposal);
  saveProposals(proposals);
}
export function deleteProposal(id: string): void {
  saveProposals(getProposals().filter((p) => p.id !== id));
}
export function updateProposal(updated: Proposal): void {
  saveProposals(getProposals().map((p) => (p.id === updated.id ? updated : p)));
}

// ── APPOINTMENTS ──────────────────────
export function getAppointments(): Appointment[] {
  return get<Appointment[]>(KEYS.APPOINTMENTS) ?? [];
}
export function saveAppointments(appointments: Appointment[]): void {
  set(KEYS.APPOINTMENTS, appointments);
}
export function addAppointment(appointment: Appointment): void {
  const appointments = getAppointments();
  appointments.push(appointment);
  saveAppointments(appointments);
}
export function deleteAppointment(id: string): void {
  saveAppointments(getAppointments().filter((a) => a.id !== id));
}
export function updateAppointment(updated: Appointment): void {
  saveAppointments(
    getAppointments().map((a) => (a.id === updated.id ? updated : a)),
  );
}

// ── CHECKLIST ─────────────────────────
export function getChecklist(): ChecklistItem[] {
  return get<ChecklistItem[]>(KEYS.CHECKLIST) ?? [];
}
export function saveChecklist(items: ChecklistItem[]): void {
  set(KEYS.CHECKLIST, items);
}

// ── UTILS ─────────────────────────────
export function clearAllData(): void {
  Object.values(KEYS).forEach((k) => remove(k));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}
