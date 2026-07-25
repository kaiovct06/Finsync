import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { TransactionsPage } from "@/components/transactions-page";

export const Route = createFileRoute("/_app/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Finsync" },
      { name: "description", content: "Cadastre e acompanhe suas despesas no Finsync." },
      { property: "og:title", content: "Despesas — Finsync" },
      { property: "og:description", content: "Gerencie suas despesas." },
    ],
  }),
  component: () => (
    <PageContainer>
      <PageHeader title="Despesas" description="Cadastre e acompanhe suas saídas" />
      <TransactionsPage type="expense" />
    </PageContainer>
  ),
});
