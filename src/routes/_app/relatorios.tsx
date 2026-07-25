import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { useFinsync, formatBRL, type Transaction } from "@/lib/finsync-store";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_app/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Finsync" },
      { name: "description", content: "Gere relatórios financeiros por período e categoria no Finsync." },
      { property: "og:title", content: "Relatórios — Finsync" },
      { property: "og:description", content: "Relatórios financeiros." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { transactions, categories } = useFinsync();
  const [from, setFrom] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [txType, setTxType] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [generated, setGenerated] = useState<Transaction[] | null>(null);

  const availableCats = categories.filter((c) => txType === "all" ? true : c.type === txType);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (txType === "all" ? true : t.type === txType))
      .filter((t) => (categoryId === "all" ? true : t.categoryId === categoryId))
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, txType, categoryId, from, to]);

  const totalIncome = (generated ?? []).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = (generated ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const byCat = useMemo(() => {
    if (!generated) return [];
    const map = new Map<string, number>();
    generated.filter((t) => t.type === "expense").forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ name: categories.find((c) => c.id === id)?.name ?? "—", value: v }))
      .sort((a, b) => b.value - a.value);
  }, [generated, categories]);

  return (
    <PageContainer>
      <PageHeader title="Relatórios" description="Gere relatórios detalhados das suas finanças" />

      <Card className="p-5 mb-6 print:hidden">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={txType} onValueChange={(v) => { setTxType(v); setCategoryId("all"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Receitas e despesas</SelectItem>
                <SelectItem value="income">Somente receitas</SelectItem>
                <SelectItem value="expense">Somente despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setGenerated(null)}>Limpar</Button>
          <Button onClick={() => setGenerated(filtered)}>Gerar relatório</Button>
        </div>
      </Card>

      {generated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between print:hidden">
            <div className="text-sm text-muted-foreground">
              Período: {format(parseISO(from), "dd/MM/yyyy")} até {format(parseISO(to), "dd/MM/yyyy")}
            </div>
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir / Exportar</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="text-sm text-muted-foreground">Total de receitas</div>
              <div className="mt-1 text-2xl font-semibold text-income">{formatBRL(totalIncome)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground">Total de despesas</div>
              <div className="mt-1 text-2xl font-semibold text-expense">{formatBRL(totalExpense)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground">Saldo do período</div>
              <div className={`mt-1 text-2xl font-semibold ${balance >= 0 ? "text-foreground" : "text-expense"}`}>{formatBRL(balance)}</div>
            </Card>
          </div>

          {byCat.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Despesas por categoria</h3>
              <ul className="space-y-2">
                {byCat.map((c) => {
                  const pct = totalExpense > 0 ? (c.value / totalExpense) * 100 : 0;
                  return (
                    <li key={c.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">{formatBRL(c.value)} · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-expense" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b p-4 font-semibold">Movimentações ({generated.length})</div>
            {generated.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sem movimentações no período.</div>
            ) : (
              <ul className="divide-y">
                {generated.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const isIn = t.type === "income";
                  return (
                    <li key={t.id} className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{t.description}</div>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{cat?.name}</Badge>
                          <span>{format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className={`shrink-0 font-semibold tabular-nums ${isIn ? "text-income" : "text-expense"}`}>
                        {isIn ? "+" : "−"} {formatBRL(t.amount)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
