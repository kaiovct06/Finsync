import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { useFinsync, formatBRL, type Goal, type GoalStatus } from "@/lib/finsync-store";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/metas")({
  head: () => ({
    meta: [
      { title: "Metas — Finsync" },
      { name: "description", content: "Crie e acompanhe suas metas financeiras no Finsync." },
      { property: "og:title", content: "Metas — Finsync" },
      { property: "og:description", content: "Defina objetivos financeiros." },
    ],
  }),
  component: GoalsPage,
});

const statusLabel: Record<GoalStatus, string> = {
  in_progress: "Em andamento",
  completed: "Concluída",
  canceled: "Cancelada",
};

function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinsync();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [toDelete, setToDelete] = useState<Goal | null>(null);
  const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "", status: "in_progress" as GoalStatus });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openNew() {
    setEditing(null);
    setForm({ name: "", target: "", current: "0", deadline: new Date().toISOString().slice(0, 10), status: "in_progress" });
    setErrors({});
    setOpen(true);
  }
  function openEdit(g: Goal) {
    setEditing(g);
    setForm({ name: g.name, target: String(g.target), current: String(g.current), deadline: g.deadline, status: g.status });
    setErrors({});
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = "Nome obrigatório.";
    const t = Number(form.target); const c = Number(form.current);
    if (!t || t <= 0) err.target = "Valor inválido.";
    if (isNaN(c) || c < 0) err.current = "Valor inválido.";
    if (!form.deadline) err.deadline = "Data obrigatória.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const data = { name: form.name.trim(), target: t, current: c, deadline: form.deadline, status: form.status };
    if (editing) { updateGoal(editing.id, data); toast.success("Meta atualizada."); }
    else { addGoal(data); toast.success("Meta criada."); }
    setOpen(false);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Metas financeiras"
        description="Defina objetivos e acompanhe o progresso"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova meta</Button>}
      />

      {goals.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Nenhuma meta cadastrada.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <Card key={g.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{g.name}</h3>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Prazo: {format(parseISO(g.deadline), "dd MMM yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <Badge variant={g.status === "completed" ? "default" : g.status === "canceled" ? "destructive" : "secondary"}>
                    {statusLabel[g.status]}
                  </Badge>
                </div>
                <div className="mt-4">
                  <Progress value={pct} />
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatBRL(g.current)} de {formatBRL(g.target)}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /> Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(g)}><Trash2 className="h-4 w-4" /> Excluir</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} meta</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Viagem" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Valor objetivo</Label>
                <Input type="number" min="0" step="0.01" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
                {errors.target && <p className="text-xs text-destructive">{errors.target}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Valor atual</Label>
                <Input type="number" min="0" step="0.01" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
                {errors.current && <p className="text-xs text-destructive">{errors.current}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Data limite</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                {errors.deadline && <p className="text-xs text-destructive">{errors.deadline}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as GoalStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (toDelete) { deleteGoal(toDelete.id); toast.success("Meta excluída."); }
              setToDelete(null);
            }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
