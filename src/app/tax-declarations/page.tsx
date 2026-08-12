import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, FileText, ArrowRight } from "lucide-react";
import { getTaxDeclarationsDashboardData } from "@/data/tax-declarations";
import { getActiveOrganizationId } from "@/lib/session";
import { GenerateDraftButton } from "./_components/generate-draft-button";
import { cn, formatCurrency } from "@/lib/utils";
import { PrivacyBlur } from "@/components/privacy-blur";
import { formatPeriod } from "./_utils/formatPeriod";
import { getStatusInfo } from "./_utils/getStatusInfo";
import { getHistoryItemSecondaryText } from "./_utils/getHistoryItemSecondaryText";
import { LedgerRow } from "./_components/ledger-row";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function TaxDeclarationsPage() {
  const organizationId = await getActiveOrganizationId();
  const dashboardData = await getTaxDeclarationsDashboardData(organizationId);

  const { currentPeriod, history } = dashboardData;
  const declaration = currentPeriod.declaration;
  const status = declaration?.status || "Pendiente de declarar";
  const currentStatusInfo = getStatusInfo(status);

  // Calculate deadline (17th of the month following the period)
  const [pYear, pMonth] = currentPeriod.period.split("-");
  const deadlineDate = new Date(parseInt(pYear), parseInt(pMonth), 17);

  // If a declaration exists, use its values. Otherwise, use values from the period summary.
  const totalIncome = declaration
    ? parseFloat(declaration.totalIncome)
    : currentPeriod.totalIncome;
  const totalExpenses = declaration
    ? parseFloat(declaration.totalExpenses)
    : currentPeriod.totalExpenses;
  // netAmount is the taxable base (isrBase) from the declaration.
  const netAmount = declaration
    ? parseFloat(declaration.isrBase!)
    : currentPeriod.netAmount;

  let taxRate = 0;
  if (declaration) {
    taxRate = parseFloat(declaration.isrRate || "0");
  } else {
    taxRate = netAmount > 0 ? currentPeriod.estimatedTax / netAmount : 0;
  }

  // IVA values
  const displayIvaBalance = declaration
    ? parseFloat(declaration.ivaBalance || "0")
    : currentPeriod.ivaBalance;

  // Group history by fiscal year so the list stays legible no matter how many
  // years of declarations accumulate — each year collapses into its own row.
  const historyByYear = history.reduce<Record<string, typeof history>>(
    (acc, declaration) => {
      const year = declaration.fiscalPeriod.split("-")[0];
      if (!acc[year]) acc[year] = [];
      acc[year].push(declaration);
      return acc;
    },
    {},
  );

  const years = Object.keys(historyByYear).sort((a, b) => b.localeCompare(a));
  const mostRecentYear = years[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-br from-muted/30 via-background to-background">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-5xl font-light tracking-tight leading-[1.1]">
                  Declaraciones Fiscales
                  <span className="block text-muted-foreground text-2xl mt-2">
                    Cálculos informativos
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              {history.length}{" "}
              {history.length === 1
                ? "declaración presentada"
                : "declaraciones presentadas"}
            </p>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-8">
        <div className="grid gap-10">
          {/* Current Period Ledger */}
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

            {/* Ledger line items — single source of truth for the numbers,
                no repeated metric cards elsewhere on the page. */}
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
                amount={formatCurrency(netAmount)}
                emphasis
              />
              <LedgerRow
                index="04"
                label="ISR Estimado"
                meta={`Tasa del ${(taxRate * 100).toFixed(0)}%`}
                amount={formatCurrency(currentPeriod.estimatedTax)}
                toneClassName="text-chart-2"
              />
              <LedgerRow
                index="05"
                label="IVA Estimado"
                meta="Cobrado - Acreditable"
                amount={formatCurrency(displayIvaBalance)}
                toneClassName="text-chart-2"
              />
            </div>

            {/* Action stub — the only place the CTA lives */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border px-6 py-6 sm:px-8">
              {currentPeriod.declaration ? (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-chart-4" />
                    <div>
                      <p className="text-sm font-medium">
                        Declaración generada
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Lista para revisión y presentación
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/tax-declarations/${currentPeriod.declaration.id}`}
                  >
                    <Button
                      size="lg"
                      className="gap-2 font-mono text-xs uppercase tracking-wider"
                    >
                      <Eye className="h-4 w-4" />
                      Revisar Declaración
                    </Button>
                  </Link>
                </>
              ) : (
                <>
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
                  <GenerateDraftButton
                    period={currentPeriod.period}
                    declarationType="monthly"
                  />
                </>
              )}
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
                                            declaration.filedAt,
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
                                  asChild
                                >
                                  <Link
                                    href={`/tax-declarations/${declaration.id}`}
                                  >
                                    Ver
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>
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
      </section>
    </div>
  );
}
