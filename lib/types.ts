// ════════════════════════════════════
// TIPOS GLOBAIS — Everest Maker
// ════════════════════════════════════

export type WeddingStatus = "planejando" | "confirmado" | "realizado";
export type BudgetStatus = "ok" | "atencao" | "estourado";

export interface WeddingData {
  id: string;
  coupleName: string;
  weddingDate: string;
  venueName?: string;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  weddingId: string;
  category: string;
  description: string;
  amount: number;
  paidAmount: number;
  createdAt: string;
}

export type VendorCategory =
  | "Fotografia"
  | "Filmagem"
  | "Buffet"
  | "Decoração"
  | "Música / DJ"
  | "Vestido"
  | "Traje do noivo"
  | "Bolo"
  | "Convites"
  | "Cerimonial"
  | "Transporte"
  | "Local / Espaço"
  | "Maquiagem / Cabelo"
  | "Flores"
  | "Outro";

export interface Vendor {
  id: string;
  weddingId: string;
  name: string;
  category: string;
  value?: number;
  phone?: string;
  email?: string;
  instagram?: string;
  notes?: string;
  createdAt: string;
}

export type ProposalStatus = "negociando" | "fechado" | "recusado";

export interface Proposal {
  id: string;
  weddingId: string;
  vendorName: string;
  vendorId?: string;
  category: string;
  value: number;
  status: ProposalStatus;
  notes?: string;
  budgetItemId?: string;
  createdAt: string;
}

export type AppointmentType =
  | "Reunião"
  | "Visita técnica"
  | "Prova"
  | "Pagamento"
  | "Degustação"
  | "Outro";

export interface Appointment {
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

export interface User {
  id: string;
  name: string;
  email: string;
  partnerName?: string;
  createdAt: string;
}

export const VENDOR_CATEGORIES: VendorCategory[] = [
  "Fotografia",
  "Filmagem",
  "Buffet",
  "Decoração",
  "Música / DJ",
  "Vestido",
  "Traje do noivo",
  "Bolo",
  "Convites",
  "Cerimonial",
  "Transporte",
  "Local / Espaço",
  "Maquiagem / Cabelo",
  "Flores",
  "Outro",
];

export const APPOINTMENT_TYPES: AppointmentType[] = [
  "Reunião",
  "Visita técnica",
  "Prova",
  "Pagamento",
  "Degustação",
  "Outro",
];

export interface ChecklistItem {
  id: string;
  title: string;
  monthsBefore: number;
  completed: boolean;
  isCustom?: boolean;
}

export const DEFAULT_CHECKLIST = [
  { monthsBefore: 12, title: "Definir o orçamento total do casamento" },
  {
    monthsBefore: 12,
    title: "Escolher e reservar o local da cerimônia e recepção",
  },
  { monthsBefore: 12, title: "Montar a lista de convidados" },
  { monthsBefore: 12, title: "Pesquisar e contratar cerimonialista" },
  { monthsBefore: 9, title: "Contratar fotógrafo e cinegrafista" },
  { monthsBefore: 9, title: "Contratar buffet / catering" },
  { monthsBefore: 9, title: "Escolher o tema e paleta de cores" },
  { monthsBefore: 9, title: "Pesquisar e contratar decorador(a)" },
  { monthsBefore: 6, title: "Escolher e encomendar o vestido de noiva" },
  { monthsBefore: 6, title: "Escolher o traje do noivo" },
  { monthsBefore: 6, title: "Contratar banda ou DJ" },
  { monthsBefore: 6, title: "Escolher e encomendar convites" },
  { monthsBefore: 6, title: "Contratar florista" },
  { monthsBefore: 4, title: "Realizar degustação do cardápio" },
  { monthsBefore: 4, title: "Encomendar o bolo de casamento" },
  { monthsBefore: 4, title: "Agendar prova de maquiagem e cabelo" },
  { monthsBefore: 4, title: "Montar lista de presentes" },
  { monthsBefore: 3, title: "Enviar convites" },
  { monthsBefore: 3, title: "Contratar transporte" },
  { monthsBefore: 3, title: "Primeira prova do vestido" },
  { monthsBefore: 3, title: "Comprar alianças" },
  { monthsBefore: 2, title: "Confirmar todos os fornecedores" },
  { monthsBefore: 2, title: "Definir playlist de músicas" },
  { monthsBefore: 2, title: "Prova final do vestido / traje" },
  { monthsBefore: 2, title: "Planejar lua de mel" },
  { monthsBefore: 1, title: "Confirmar presença dos convidados (RSVP)" },
  { monthsBefore: 1, title: "Definir layout e mapa das mesas" },
  { monthsBefore: 1, title: "Ensaio fotográfico pré-wedding" },
  { monthsBefore: 1, title: "Reunião final com cerimonialista" },
  { monthsBefore: 0, title: "Ensaio da cerimônia" },
  { monthsBefore: 0, title: "Confirmar horários com todos os fornecedores" },
  { monthsBefore: 0, title: "Separar documentos necessários" },
  { monthsBefore: 0, title: "Preparar kit de emergência" },
];
