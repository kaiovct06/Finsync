import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFinsync, formatBRL, type Transaction, type TxType } from "@/lib/finsync-store";
import { toast } from "sonner";

interface Props {
  type: TxType;
}

export function TransactionsPage({ type }: Props) {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useFinsync();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const items = useMemo(() => {
    return transactions
      .filter((t) => t.type === type)
      .filter((t) => (filterCat === "all" ? true : t.categoryId === filterCat))
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, type, filterCat, from, to]);

  const cats = categories.filter((c) => c.type === type);
  const total = items.reduce((s, t) => s + t.amount, 0);
  const isIncome = type === "income";
  const label = isIncome ? "receita" : "despesa";
  const Label2 = isIncome ? "Receita" : "Despesa";

  return (
    <div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total exibido</div>
          <div className={`mt-1 text-2xl font-semibold ${isIncome ? "text-income" : "text-expense"}`}>
            {formatBRL(total)}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Quantidade</div>
          <div className="mt-1 text-2xl font-semibold">{items.length}</div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Nova movimentação</div>
            <div className="text-xs text-muted-foreground/80">Registre uma {label}</div>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Categoria</Label>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setFilterCat("all");
                setFrom("");
                setTo("");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma {label} encontrada. Clique em "Adicionar" para começar.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <li key={t.id} className="flex items-center gap-4 p-4">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${isIncome ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
                    {isIncome ? "+" : "−"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.description}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{cat?.name ?? "Sem categoria"}</Badge>
                      <span>{format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}</span>
                      {t.note && <span className="truncate">• {t.note}</span>}
                    </div>
                  </div>
                  <div className={`shrink-0 font-semibold tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
                    {isIncome ? "+" : "−"} {formatBRL(t.amount)}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setToDelete(t)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <TransactionDialog
        open={open}
        onOpenChange={setOpen}
        type={type}
        editing={editing}
        onSave={(data) => {
          if (editing) {
            updateTransaction(editing.id, data);
            toast.success(`${Label2} atualizada.`);
          } else {
            addTransaction({ ...data, type });
            toast.success(`${Label2} adicionada.`);
          }
          setOpen(false);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) {
                  deleteTransaction(toDelete.id);
                  toast.success(`${Label2} excluída.`);
                }
                setToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TransactionDialog({
  open,
  onOpenChange,
  type,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: TxType;
  editing: Transaction | null;
  onSave: (data: Omit<Transaction, "id" | "type">) => void;
}) {
  const { categories } = useFinsync();
  const cats = categories.filter((c) => c.type === type);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // reset form on open
  useMemo(() => {
    if (open) {
      setDescription(editing?.description ?? "");
      setAmount(editing ? String(editing.amount) : "");
      setDate(editing?.date ?? new Date().toISOString().slice(0, 10));
      setCategoryId(editing?.categoryId ?? cats[0]?.id ?? "");
      setNote(editing?.note ?? "");
      setErrors({});
    }
  }, [open, editing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!description.trim()) err.description = "Descreva a movimentação.";
    const n = Number(amount);
    if (!amount || isNaN(n) || n <= 0) err.amount = "Valor inválido.";
    if (!date) err.date = "Data obrigatória.";
    if (!categoryId) err.categoryId = "Escolha uma categoria.";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({ description: description.trim(), amount: n, date, categoryId, note: note.trim() || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar" : "Adicionar"} {type === "income" ? "receita" : "despesa"}</DialogTitle>
          <DialogDescription>Preencha as informações da movimentação.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Mercado do mês" />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Observação (opcional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
