import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useFinsync } from "@/lib/finsync-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Finsync" },
      { name: "description", content: "Acesse sua conta Finsync para gerenciar suas finanças pessoais." },
      { property: "og:title", content: "Entrar — Finsync" },
      { property: "og:description", content: "Acesse sua conta Finsync." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useFinsync();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: typeof errors = {};
    if (!email) err.email = "Informe seu e-mail.";
    if (!password) err.password = "Informe sua senha.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const r = login(email, password);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Bem-vindo(a) de volta!");
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
          <h1 className="text-2xl font-semibold tracking-tight">Entrar na sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use <span className="font-medium">demo@finsync.app</span> / <span className="font-medium">123456</span> para experimentar.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg">Entrar</Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => toast.info("Envie um e-mail para suporte@finsync.app para redefinir sua senha.")}
              className="text-muted-foreground hover:text-foreground"
            >
              Esqueci minha senha
            </button>
            <div className="text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Criar uma conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
