import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useFinsync } from "@/lib/finsync-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, PieChart, Target, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { currentUser } = useFinsync();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate({ to: "/dashboard" });
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
            F
          </div>
          <span className="text-lg font-semibold tracking-tight">Finsync</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link to="/register">
            <Button>Criar conta</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border bg-accent/50 px-3 py-1 text-xs font-medium text-accent-foreground">
            Controle financeiro pessoal
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Suas finanças, organizadas com clareza.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Registre receitas e despesas, acompanhe metas e visualize seu saldo em um painel simples e moderno. Sem consultoria, sem investimentos — só o essencial.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Começar agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Wallet, title: "Receitas e despesas", desc: "Registre movimentações com categorias e datas." },
            { icon: PieChart, title: "Painel visual", desc: "Gráficos claros de entrada, saída e categorias." },
            { icon: Target, title: "Metas financeiras", desc: "Defina objetivos e acompanhe o progresso." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
