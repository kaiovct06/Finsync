import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { useFinsync, formatBRL } from "@/lib/finsync-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ArrowUpCircle, ArrowDownCircle, Target } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Finsync" },
      { name: "description", content: "Visão geral das suas finanças pessoais no Finsync." },
      { property: "og:title", content: "Dashboard — Finsync" },
      { property: "og:description", content: "Visão geral do seu dinheiro." },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];
const PALETTE = ["#0e9f7e", "#e5484d", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444"];

function periodRange(key: string) {
  const now = new Date();
  if (key === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  if (key === "3m") return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
  if (key === "6m") return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
  return { from: new Date(2000, 0, 1), to: new Date(3000, 0, 1) };
}

function DashboardPage() {
  const { transactions, categories, goals } = useFinsync();
  const [period, setPeriod] = useState("month");
  const { from, to } = periodRange(period);
  const inRange = (iso: string) => {
    const d = parseISO(iso);
    return d >= from && d <= to;
  };

  const filtered = useMemo(() => transactions.filter((t) => inRange(t.date)), [transactions, period]);
  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const allBalance = transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  // monthly series
  const months = useMemo(() => {
    const n = period === "6m" ? 6 : period === "3m" ? 3 : period === "month" ? 1 : 6;
    return Array.from({ length: n }, (_, i) => {
      const d = subMonths(new Date(), n - 1 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const inc = transactions.filter((t) => t.type === "income" && parseISO(t.date) >= start && parseISO(t.date) <= end).reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter((t) => t.type === "expense" && parseISO(t.date) >= start && parseISO(t.date) <= end).reduce((s, t) => s + t.amount, 0);
      return { month: format(d, "MMM", { locale: ptBR }), Receitas: inc, Despesas: exp };
    });
  }, [transactions, period]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter((t) => t.type === "expense").forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).map(([id, value]) => ({
      name: categories.find((c) => c.id === id)?.name ?? "—",
      value,
    })).sort((a, b) => b.value - a.value);
  }, [filtered, categories]);

  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const activeGoals = goals.filter((g) => g.status === "in_progress");

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Resumo das suas finanças"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Saldo atual</div>
          <div className={`mt-1 text-3xl font-semibold ${allBalance >= 0 ? "text-foreground" : "text-expense"}`}>
            {formatBRL(allBalance)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Considera todas as movimentações</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Receitas do período</div>
          <div className="mt-1 text-3xl font-semibold text-income">{formatBRL(totalIncome)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Despesas do período</div>
          <div className="mt-1 text-3xl font-semibold text-expense">{formatBRL(totalExpense)}</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link to="/receitas"><Button variant="outline" className="w-full justify-start gap-2"><ArrowUpCircle className="h-4 w-4 text-income" /> Adicionar receita</Button></Link>
        <Link to="/despesas"><Button variant="outline" className="w-full justify-start gap-2"><ArrowDownCircle className="h-4 w-4 text-expense" /> Adicionar despesa</Button></Link>
        <Link to="/metas"><Button variant="outline" className="w-full justify-start gap-2"><Target className="h-4 w-4 text-goal" /> Nova meta</Button></Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Receitas x Despesas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="var(--income)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--expense)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Despesas por categoria</h3>
          {expensesByCategory.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">Sem despesas no período.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={expensesByCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {expensesByCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mt-3 space-y-1.5">
            {expensesByCategory.slice(0, 5).map((c, i) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span>{c.name}</span>
                </div>
                <span className="tabular-nums text-muted-foreground">{formatBRL(c.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Últimas movimentações</h3>
            <Link to="/despesas" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                const isIn = t.type === "income";
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isIn ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
                      {isIn ? "+" : "−"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {cat?.name} • {format(parseISO(t.date), "dd MMM", { locale: ptBR })}
                      </div>
                    </div>
                    <div className={`shrink-0 text-sm font-semibold tabular-nums ${isIn ? "text-income" : "text-expense"}`}>
                      {isIn ? "+" : "−"} {formatBRL(t.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Metas</h3>
            <Link to="/metas" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          {activeGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma meta em andamento.</p>
          ) : (
            <ul className="space-y-4">
              {activeGoals.slice(0, 4).map((g) => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                return (
                  <li key={g.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{g.name}</span>
                      <Badge variant="secondary">{pct}%</Badge>
                    </div>
                    <Progress value={pct} />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatBRL(g.current)} de {formatBRL(g.target)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
