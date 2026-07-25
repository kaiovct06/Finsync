import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TxType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color?: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  date: string; // ISO
  categoryId: string;
  note?: string;
}

export type GoalStatus = "in_progress" | "completed" | "canceled";

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string; // ISO date
  status: GoalStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface FinsyncState {
  users: User[];
  currentUserId: string | null;
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
}

const STORAGE_KEY = "finsync-state-v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const defaultCategories: Category[] = [
  { id: uid(), name: "Salário", type: "income" },
  { id: uid(), name: "Freelance", type: "income" },
  { id: uid(), name: "Benefícios", type: "income" },
  { id: uid(), name: "Outros", type: "income" },
  { id: uid(), name: "Alimentação", type: "expense" },
  { id: uid(), name: "Transporte", type: "expense" },
  { id: uid(), name: "Moradia", type: "expense" },
  { id: uid(), name: "Saúde", type: "expense" },
  { id: uid(), name: "Educação", type: "expense" },
  { id: uid(), name: "Lazer", type: "expense" },
  { id: uid(), name: "Outros", type: "expense" },
];

function seed(): FinsyncState {
  const cats = defaultCategories;
  const demoUser: User = {
    id: uid(),
    name: "Usuário Demo",
    email: "demo@finsync.app",
    password: "123456",
  };
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  const salario = cats.find((c) => c.name === "Salário")!.id;
  const freela = cats.find((c) => c.name === "Freelance")!.id;
  const alim = cats.find((c) => c.name === "Alimentação")!.id;
  const trans = cats.find((c) => c.name === "Transporte")!.id;
  const mor = cats.find((c) => c.name === "Moradia")!.id;
  const laz = cats.find((c) => c.name === "Lazer")!.id;
  const transactions: Transaction[] = [
    { id: uid(), type: "income", description: "Salário mensal", amount: 5200, date: daysAgo(2), categoryId: salario },
    { id: uid(), type: "income", description: "Projeto freelance", amount: 1200, date: daysAgo(8), categoryId: freela },
    { id: uid(), type: "expense", description: "Aluguel", amount: 1800, date: daysAgo(3), categoryId: mor },
    { id: uid(), type: "expense", description: "Mercado", amount: 640, date: daysAgo(5), categoryId: alim },
    { id: uid(), type: "expense", description: "Uber", amount: 90, date: daysAgo(1), categoryId: trans },
    { id: uid(), type: "expense", description: "Cinema", amount: 65, date: daysAgo(4), categoryId: laz },
    { id: uid(), type: "expense", description: "Restaurante", amount: 120, date: daysAgo(6), categoryId: alim },
  ];
  const goals: Goal[] = [
    { id: uid(), name: "Reserva de emergência", target: 10000, current: 3200, deadline: iso(new Date(today.getFullYear(), today.getMonth() + 6, 1)), status: "in_progress" },
    { id: uid(), name: "Viagem de férias", target: 4000, current: 1500, deadline: iso(new Date(today.getFullYear(), today.getMonth() + 4, 15)), status: "in_progress" },
  ];
  return {
    users: [demoUser],
    currentUserId: null,
    categories: cats,
    transactions,
    goals,
  };
}

function load(): FinsyncState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as FinsyncState;
  } catch {
    return seed();
  }
}

interface FinsyncContextValue extends FinsyncState {
  currentUser: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "password">>) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => { ok: boolean; error?: string };
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

const Ctx = createContext<FinsyncContextValue | null>(null);

export function FinsyncProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinsyncState>(() => seed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;

  const value: FinsyncContextValue = {
    ...state,
    currentUser,
    login: (email, password) => {
      const u = state.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
      if (!u) return { ok: false, error: "E-mail ou senha inválidos." };
      setState((s) => ({ ...s, currentUserId: u.id }));
      return { ok: true };
    },
    register: (name, email, password) => {
      if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, error: "E-mail já cadastrado." };
      }
      const u: User = { id: uid(), name, email, password };
      setState((s) => ({ ...s, users: [...s.users, u], currentUserId: u.id }));
      return { ok: true };
    },
    logout: () => setState((s) => ({ ...s, currentUserId: null })),
    updateProfile: (patch) =>
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, ...patch } : u)),
      })),
    addTransaction: (t) =>
      setState((s) => ({ ...s, transactions: [{ ...t, id: uid() }, ...s.transactions] })),
    updateTransaction: (id, patch) =>
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
    deleteTransaction: (id) =>
      setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })),
    addCategory: (c) =>
      setState((s) => ({ ...s, categories: [...s.categories, { ...c, id: uid() }] })),
    updateCategory: (id, patch) =>
      setState((s) => ({
        ...s,
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    deleteCategory: (id) => {
      if (state.transactions.some((t) => t.categoryId === id)) {
        return { ok: false, error: "Categoria em uso por movimentações." };
      }
      setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
      return { ok: true };
    },
    addGoal: (g) => setState((s) => ({ ...s, goals: [...s.goals, { ...g, id: uid() }] })),
    updateGoal: (id, patch) =>
      setState((s) => ({
        ...s,
        goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      })),
    deleteGoal: (id) => setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFinsync() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFinsync must be used within FinsyncProvider");
  return ctx;
}

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
