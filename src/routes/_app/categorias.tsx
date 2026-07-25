import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { useFinsync, type Category, type TxType } from "@/lib/finsync-store";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Finsync" },
      { name: "description", content: "Organize categorias de receitas e despesas no Finsync." },
      { property: "og:title", content: "Categorias — Finsync" },
      { property: "og:description", content: "Organize suas categorias." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useFinsync();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<TxType>("expense");

  function openNew() {
    setEditing(null);
    setName("");
    setType("expense");
    setOpen(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      updateCategory(editing.id, { name: name.trim(), type });
      toast.success("Categoria atualizada.");
    } else {
      addCategory({ name: name.trim(), type });
      toast.success("Categoria criada.");
    }
    setOpen(false);
  }

  function renderList(t: TxType) {
    const list = categories.filter((c) => c.type === t);
    return (
      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma categoria.</div>
        ) : (
          <ul className="divide-y">
            {list.map((c) => {
              const inUse = transactions.some((tx) => tx.categoryId === c.id);
              return (
                <li key={c.id} className="flex items-center gap-3 p-4">
                  <div className={`h-2.5 w-2.5 rounded-full ${t === "income" ? "bg-income" : "bg-expense"}`} />
                  <div className="flex-1 font-medium">{c.name}</div>
                  {inUse && <Badge variant="secondary">Em uso</Badge>}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Categorias"
        description="Organize suas receitas e despesas"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova categoria</Button>}
      />
      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-4">{renderList("expense")}</TabsContent>
        <TabsContent value="income" className="mt-4">{renderList("income")}</TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nova"} categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Assinaturas" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as TxType)} className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="expense" id="ce" /> Despesa</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="income" id="ci" /> Receita</label>
              </RadioGroup>
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
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>Categorias em uso não podem ser excluídas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) {
                  const r = deleteCategory(toDelete.id);
                  if (r.ok) toast.success("Categoria excluída.");
                  else toast.error(r.error);
                }
                setToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
