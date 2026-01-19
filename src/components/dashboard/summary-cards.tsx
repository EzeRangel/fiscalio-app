"use client";

import { Invoice } from "@/types/invoices";
import {
  CalendarDays,
  Inbox,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import usePrice from "@/hooks/usePrice";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { SummaryCard } from "../summary-card";
import { DashboardMetrics } from "@/types/dashboard";
import { Skeleton } from "../ui/skeleton";

interface Props {
  monthName: string;
  invoices?: Invoice[];
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

export default function SummaryCards({ monthName, invoices, metrics, isLoading }: Props) {
  const hasInvoices = !!invoices && invoices?.length > 0;
  
  const income = metrics?.income ?? 0;
  const expense = metrics?.expenses ?? 0;
  const net = income - expense;

  const formattedIncome = usePrice(income);
  const formattedExpense = usePrice(expense);
  const formattedNet = usePrice(net);

  const nextDeclaration = metrics?.nextDeclarationDate 
    ? new Date(metrics.nextDeclarationDate).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
      })
    : "Pendiente";

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {hasInvoices || metrics ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Ingresos"
            value={formattedIncome}
            subtitle={`${invoices?.filter((inv) => inv.cfdiType === "I").length || 0} facturas`}
            icon={TrendingUp}
            color="green"
          />

          <SummaryCard
            title="Egresos"
            value={formattedExpense}
            subtitle={`${invoices?.filter((inv) => inv.cfdiType === "E").length || 0} facturas`}
            icon={TrendingDown}
            color="red"
          />

          <SummaryCard
            title="Neto"
            value={formattedNet}
            subtitle="Balance del periodo"
            icon={Wallet}
            color="blue"
          />

          <SummaryCard
            title="Próxima Declaración"
            value={nextDeclaration}
            subtitle="Fecha límite sugerida"
            icon={CalendarDays}
            color="amber"
          />
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>Sin actividad fiscal este mes</EmptyTitle>
            <EmptyDescription>
              No hay facturas registradas para {monthName}. Las métricas
              financieras aparecerán cuando se emitan los primeros documentos
              fiscales.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}