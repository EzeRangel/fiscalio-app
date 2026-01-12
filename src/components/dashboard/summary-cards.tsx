"use client";

import { Invoice } from "@/types/invoices";
import { Card } from "../ui/card";
import {
  FileText,
  Inbox,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import usePrice from "@/hooks/usePrice";
import { PrivacyBlur } from "../privacy-blur";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";

interface Props {
  monthName: string;
  invoices?: Invoice[];
}

export default function SummaryCards({ monthName, invoices }: Props) {
  const hasInvoices = !!invoices && invoices?.length > 0;

  const income =
    invoices
      ?.filter((inv) => inv.cfdiType === "I")
      ?.reduce((sum, inv) => sum + Number(inv.total), 0) ?? 0;

  const expense =
    invoices
      ?.filter((inv) => inv.cfdiType === "E")
      ?.reduce((sum, inv) => sum + Math.abs(Number(inv.total)), 0) ?? 0;

  const net = income - expense;

  // TODO: Calculate IVA amounts by invoice taxes
  const ivaRate = 0.16;
  const ivaCobrado = income * (ivaRate / (1 + ivaRate));
  const ivaPagado = expense * (ivaRate / (1 + ivaRate));
  const ivaAPagar = ivaCobrado - ivaPagado;

  const formattedIncome = usePrice(income);
  const formattedExpense = usePrice(expense);
  const formattedNet = usePrice(net);

  const formattedIVAToPay = usePrice(ivaAPagar);
  const formattedIVAToCharge = usePrice(ivaCobrado);

  return (
    <div className="space-y-12">
      {hasInvoices ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 space-y-4 bg-linear-to-br from-emerald-500/5 via-background to-background border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Ingresos
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <PrivacyBlur>{formattedIncome}</PrivacyBlur>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {invoices.filter((inv) => inv.cfdiType === "I").length} facturas
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 bg-linear-to-br from-red-500/5 via-background to-background border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Egresos
              </div>
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-mono font-medium text-red-600 dark:text-red-400">
                <PrivacyBlur>{formattedExpense}</PrivacyBlur>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {invoices.filter((inv) => inv.cfdiType === "E").length} notas de
                crédito
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 bg-linear-to-br from-primary/5 via-background to-background border-primary/20">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Neto
              </div>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-mono font-medium">
                <PrivacyBlur>{formattedNet}</PrivacyBlur>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {invoices.length} documentos totales
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 bg-linear-to-br from-amber-500/5 via-background to-background border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                IVA a Pagar
              </div>
              <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-mono font-medium text-amber-600 dark:text-amber-400">
                <PrivacyBlur>{formattedIVAToPay}</PrivacyBlur>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Cobrado: <PrivacyBlur>{formattedIVAToCharge}</PrivacyBlur>
              </div>
            </div>
          </Card>
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
