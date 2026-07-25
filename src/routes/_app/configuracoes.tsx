import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { useFinsync } from "@/lib/finsync-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Finsync" },
      { name: "description", content: "Gerencie seus dados pessoais e senha no Finsync." },
      { property: "og:title", content: "Configurações — Finsync" },
      { property: "og:description", content: "Ajuste seus dados." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { currentUser, updateProfile } = useFinsync();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    updateProfile({ name: name.trim(), email: email.trim() });
    toast.success("Dados atualizados.");
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    if (current !== currentUser.password) {
      toast.error("Senha atual incorreta.");
      return;
    }
    if (next.length < 6) {
      toast.error("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (next !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    updateProfile({ password: next });
    setCurrent(""); setNext(""); setConfirm("");
    toast.success("Senha alterada.");
  }

  return (
    <PageContainer>
      <PageHeader title="Configurações" description="Seus dados pessoais e segurança" />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Dados pessoais</h3>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit">Salvar alterações</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Alterar senha</h3>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Senha atual</Label>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nova senha</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit">Atualizar senha</Button>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
