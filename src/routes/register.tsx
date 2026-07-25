import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useFinsync } from "@/lib/finsync-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Criar conta — Finsync" },
      { name: "description", content: "Crie sua conta Finsync gratuitamente e organize suas finanças." },
      { property: "og:title", content: "Criar conta — Finsync" },
      { property: "og:description", content: "Crie sua conta Finsync." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useFinsync();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = "Informe seu nome completo.";
    if (!email.trim()) err.email = "Informe um e-mail.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) err.email = "E-mail inválido.";
    if (!password) err.password = "Informe uma senha.";
    else if (password.length < 6) err.password = "A senha deve ter ao menos 6 caracteres.";
    if (password !== confirm) err.confirm = "As senhas não coincidem.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const r = register(name.trim(), email.trim(), password);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Conta criada com sucesso!");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-6 py-10">
        <div className="w-full">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">F</div>
            <span className="text-lg font-semibold tracking-tight">Finsync</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Criar sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">É rápido e gratuito.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha" />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full">Criar conta</Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
