import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { TransactionsPage } from "@/components/transactions-page";

export const Route = createFileRoute("/_app/receitas")({
  head: () => ({
    meta: [
      { title: "Receitas — Finsync" },
      { name: "description", content: "Cadastre e acompanhe suas receitas no Finsync." },
      { property: "og:title", content: "Receitas — Finsync" },
      { property: "og:description", content: "Gerencie suas receitas." },
    ],
  }),
  component: () => (
    <PageContainer>
      <PageHeader title="Receitas" description="Cadastre e acompanhe suas entradas" />
      <TransactionsPage type="income" />
    </PageContainer>
  ),
});
