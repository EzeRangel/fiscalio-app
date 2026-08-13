"use client";

import { CheckCircle2, FileText, ArrowRight, ClockFading } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LedgerRow } from "@/app/tax-declarations/_components/ledger-row";
import { getStatusInfo } from "@/app/tax-declarations/_utils/getStatusInfo";
import { formatPeriod } from "@/app/tax-declarations/_utils/formatPeriod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const mockCurrentPeriod = {
  period: "2026-07",
  totalIncome: 75430.50,
  totalExpenses: 28900.00,
  incomeInvoiceCount: 12,
  expenseInvoiceCount: 8,
  netAmount: 75430.50, // En RESICO la base gravable de ISR es el total de ingresos cobrados
  estimatedTax: 1131.46, // 75430.50 * 1.50% (tasa RESICO para rango de ingresos)
  ivaBalance: 7444.88, // IVA Trasladado (75430.50 * 0.16) - IVA Acreditable (28900.00 * 0.16)
  declaration: null,
};

const mockHistory = [
  {
    id: 101,
    fiscalPeriod: "2026-06",
    status: "filed",
    filedAt: "2026-07-15T10:30:00Z",
    createdAt: "2026-07-02T09:00:00Z",
    updatedAt: "2026-07-15T10:30:00Z",
  },
  {
    id: 102,
    fiscalPeriod: "2026-05",
    status: "validated",
    createdAt: "2026-06-03T11:00:00Z",
    updatedAt: "2026-06-12T15:20:00Z",
  },
  {
    id: 103,
    fiscalPeriod: "2026-04",
    status: "exported",
    exportedAt: "2026-05-14T17:45:00Z",
    createdAt: "2026-05-02T10:00:00Z",
    updatedAt: "2026-05-14T17:45:00Z",
  },
  {
    id: 104,
    fiscalPeriod: "2026-03",
    status: "filed",
    filedAt: "2026-04-17T11:15:00Z",
    createdAt: "2026-04-03T09:30:00Z",
    updatedAt: "2026-04-17T11:15:00Z",
  },
];

export function DeclarationsDemo({ onSelectDeclaration }: { onSelectDeclaration: (id: number) => void }) {
  const currentPeriod = mockCurrentPeriod;
  const status = "Pendiente de declarar";
  const currentStatusInfo = getStatusInfo(status);

  const [pYear, pMonth] = currentPeriod.period.split("-");
  const deadlineDate = new Date(parseInt(pYear), parseInt(pMonth), 17);

  const historyByYear = mockHistory.reduce<Record<string, typeof mockHistory>>(
    (acc, dec) => {
      const year = dec.fiscalPeriod.split("-")[0];
      if (!acc[year]) acc[year] = [];
      acc[year].push(dec);
      return acc;
    },
    {},
  );

  const years = Object.keys(historyByYear).sort((a, b) => b.localeCompare(a));
  const mostRecentYear = years[0];

  return (
    <div className="space-y-12">
      <div className="border border-border bg-card">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground/80 px-6 pb-5 pt-6 sm:px-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Período Actual
            </p>
            <h2 className="text-3xl font-light tracking-tight capitalize mt-1">
              {formatPeriod(currentPeriod.period)}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">
              Límite para declarar: {format(deadlineDate, "d 'de' MMMM yyyy", { locale: es })}
            </span>
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border font-mono text-xs",
                currentStatusInfo.className,
              )}
            >
              {currentStatusInfo.icon}
              {currentStatusInfo.text}
            </div>
          </div>
        </div>

        <div>
          <LedgerRow
            index="01"
            label="Ingresos Totales"
            meta={`${currentPeriod.incomeInvoiceCount} facturas emitidas`}
            amount={formatCurrency(currentPeriod.totalIncome)}
            toneClassName="text-chart-4"
          />
          <LedgerRow
            index="02"
            label="Gastos Totales"
            meta={`${currentPeriod.expenseInvoiceCount} facturas recibidas`}
            amount={`− ${formatCurrency(currentPeriod.totalExpenses)}`}
            toneClassName="text-chart-3"
          />
          <LedgerRow
            index="03"
            label="Base Gravable"
            meta="Ingresos Brutos"
            amount={formatCurrency(currentPeriod.netAmount)}
            emphasis
          />
          <LedgerRow
            index="04"
            label="ISR Estimado"
            meta="Tasa del 1.5%"
            amount={formatCurrency(currentPeriod.estimatedTax)}
            toneClassName="text-chart-2"
          />
          <LedgerRow
            index="05"
            label="IVA Estimado"
            meta="Cobrado - Acreditable"
            amount={formatCurrency(currentPeriod.ivaBalance)}
            toneClassName="text-chart-2"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border px-6 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Sin declaración para este período
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                Genera el borrador a partir de las facturas registradas
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="gap-2 font-mono text-xs uppercase tracking-wider"
            onClick={() => onSelectDeclaration(102)}
          >
            Generar Borrador
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-light tracking-tight">
              Historial de Declaraciones
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Agrupado por ejercicio fiscal
            </p>
          </div>
        </div>

        {years.length > 0 ? (
          <div className="border border-border bg-card">
            <Accordion
              type="multiple"
              defaultValue={mostRecentYear ? [mostRecentYear] : []}
            >
              {years.map((year) => {
                const declarations = historyByYear[year].sort((a, b) =>
                  b.fiscalPeriod.localeCompare(a.fiscalPeriod),
                );
                return (
                  <AccordionItem
                    key={year}
                    value={year}
                    className="border-border"
                  >
                    <AccordionTrigger className="px-6 py-4 sm:px-8 hover:no-underline rounded-none">
                      <div className="flex w-full items-baseline justify-between pr-2">
                        <span className="font-mono text-lg tracking-tight">
                          {year}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {declarations.length}{" "}
                          {declarations.length === 1
                            ? "declaración"
                            : "declaraciones"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 px-0">
                      <div className="border-t border-border">
                        {declarations.map((declaration) => (
                          <div
                            key={declaration.id}
                            className="flex items-center justify-between gap-4 px-6 py-3.5 sm:px-8 border-b border-border/60 last:border-b-0 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="h-4 w-4 text-chart-4 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium capitalize">
                                  {formatPeriod(declaration.fiscalPeriod)}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  Presentada el{" "}
                                  {declaration.filedAt
                                    ? format(
                                        new Date(declaration.filedAt),
                                        "d 'de' MMMM yyyy",
                                        { locale: es },
                                      )
                                    : "-"}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 font-mono text-xs shrink-0"
                              onClick={() => onSelectDeclaration(declaration.id)}
                            >
                              Ver
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border">
            <div className="inline-flex items-center justify-center h-12 w-12 border border-border mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground font-mono">
              No hay declaraciones en el historial
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
