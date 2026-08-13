"use client";

import { AlertCircle, ArrowLeftIcon, XCircle, CheckCircle, FileText, FileDown, ShieldCheck, Send } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatPeriod } from "@/app/tax-declarations/_utils/formatPeriod";
import { getStatusInfo } from "@/app/tax-declarations/_utils/getStatusInfo";
import { Button } from "@/components/ui/button";
import { TAX_REGIMES } from "@/lib/constants";

// Mock data definitions for details
const mockDeclarations: Record<number, any> = {
  101: {
    id: 101,
    fiscalPeriod: "2026-06",
    status: "filed",
    taxRegime: "626",
    declarationType: "monthly",
    createdAt: new Date("2026-07-02T09:00:00Z"),
    updatedAt: new Date("2026-07-15T10:30:00Z"),
    filedAt: new Date("2026-07-15T10:30:00Z"),
    acknowledgmentNumber: "SAT-ACK-982347910283",
    totalIncome: 65430.50,
    deductibleExpenses: 0.00,
    isrBase: 65430.50,
    isrRate: "0.015",
    isrCalculated: 981.46,
    isrWithheld: 200.00,
    isrProvisional: 0.00,
    isrBalance: 781.46,
    ivaCharged: 10468.88,
    ivaCreditable: 3504.00,
    ivaBalance: 6964.88,
    invoices: [
      { id: 1, invoice: { id: "inv-1", internalFolio: "SERVI-001", invoiceDate: new Date("2026-06-10"), businessPartner: { businessName: "Servicios Profesionales S.A." }, total: 40600, paymentMethod: "PUE" }, appliedAccountCode: "401.01", includedAmount: 35000 },
      { id: 2, invoice: { id: "inv-2", internalFolio: "SERVI-002", invoiceDate: new Date("2026-06-25"), businessPartner: { businessName: "Comercializadora Tech S. de R.L." }, total: 35300, paymentMethod: "PUE" }, appliedAccountCode: "401.01", includedAmount: 30430.5 },
      { id: 3, invoice: { id: "inv-3", internalFolio: "PAPEL-001", invoiceDate: new Date("2026-06-12"), businessPartner: { businessName: "Papelería del Centro S.A." }, total: 25404, paymentMethod: "PUE" }, appliedAccountCode: "601.12", includedAmount: 21900 }
    ],
    auditLogs: [
      { id: 1, action: "create", user: "Admin", timestamp: "2026-07-02T09:00:00Z", details: "Borrador de declaración generado automáticamente." },
      { id: 2, action: "validate", user: "Admin", timestamp: "2026-07-08T14:30:00Z", details: "Declaración verificada con éxito." },
      { id: 3, action: "file", user: "Admin", timestamp: "2026-07-15T10:30:00Z", details: "Declaración presentada ante el SAT con folio SAT-ACK-982347910283." }
    ]
  },
  102: {
    id: 102,
    fiscalPeriod: "2026-05",
    status: "draft",
    taxRegime: "626",
    declarationType: "monthly",
    createdAt: new Date("2026-06-03T11:00:00Z"),
    updatedAt: new Date("2026-06-12T15:20:00Z"),
    filedAt: null,
    acknowledgmentNumber: null,
    totalIncome: 45000.00,
    deductibleExpenses: 0.00,
    isrBase: 45000.00,
    isrRate: "0.011",
    isrCalculated: 495.00,
    isrWithheld: 150.00,
    isrProvisional: 0.00,
    isrBalance: 345.00,
    ivaCharged: 7200.00,
    ivaCreditable: 2400.00,
    ivaBalance: 4800.00,
    invoices: [
      { id: 1, invoice: { id: "inv-4", internalFolio: "SERVI-003", invoiceDate: new Date("2026-05-15"), businessPartner: { businessName: "Servicios Profesionales S.A." }, total: 29000, paymentMethod: "PUE" }, appliedAccountCode: "401.01", includedAmount: 25000 },
      { id: 2, invoice: { id: "inv-5", internalFolio: "SERVI-004", invoiceDate: new Date("2026-05-22"), businessPartner: { businessName: "Comercializadora Tech S. de R.L." }, total: 23200, paymentMethod: "PUE" }, appliedAccountCode: "401.01", includedAmount: 20000 },
      { id: 3, invoice: { id: "inv-6", internalFolio: "PAPEL-002", invoiceDate: new Date("2026-05-18"), businessPartner: { businessName: "Papelería del Centro S.A." }, total: 17400, paymentMethod: "PUE" }, appliedAccountCode: "601.12", includedAmount: 15000 }
    ],
    auditLogs: [
      { id: 1, action: "create", user: "Admin", timestamp: "2026-06-03T11:00:00Z", details: "Borrador de declaración generado automáticamente." }
    ]
  },
  103: {
    id: 103,
    fiscalPeriod: "2026-04",
    status: "validated",
    taxRegime: "626",
    declarationType: "monthly",
    createdAt: new Date("2026-05-02T10:00:00Z"),
    updatedAt: new Date("2026-05-14T17:45:00Z"),
    filedAt: null,
    acknowledgmentNumber: null,
    totalIncome: 50000.00,
    deductibleExpenses: 0.00,
    isrBase: 50000.00,
    isrRate: "0.011",
    isrCalculated: 550.00,
    isrWithheld: 100.00,
    isrProvisional: 0.00,
    isrBalance: 450.00,
    ivaCharged: 8000.00,
    ivaCreditable: 2880.00,
    ivaBalance: 5120.00,
    invoices: [
      { id: 1, invoice: { id: "inv-7", internalFolio: "SERVI-005", invoiceDate: new Date("2026-04-10"), businessPartner: { businessName: "Servicios Profesionales S.A." }, total: 58000, paymentMethod: "PUE" }, appliedAccountCode: "401.01", includedAmount: 50000 },
      { id: 2, invoice: { id: "inv-8", internalFolio: "PAPEL-003", invoiceDate: new Date("2026-04-12"), businessPartner: { businessName: "Papelería del Centro S.A." }, total: 20880, paymentMethod: "PUE" }, appliedAccountCode: "601.12", includedAmount: 18000 }
    ],
    auditLogs: [
      { id: 1, action: "create", user: "Admin", timestamp: "2026-05-02T10:00:00Z", details: "Borrador de declaración generado automáticamente." },
      { id: 2, action: "validate", user: "Admin", timestamp: "2026-05-14T17:45:00Z", details: "Declaración verificada con éxito." }
    ]
  },
  104: {
    id: 104,
    fiscalPeriod: "2026-03",
    status: "filed",
    taxRegime: "626",
    declarationType: "monthly",
    createdAt: new Date("2026-04-03T09:30:00Z"),
    updatedAt: new Date("2026-04-17T11:15:00Z"),
    filedAt: new Date("2026-04-17T11:15:00Z"),
    acknowledgmentNumber: "SAT-ACK-982347910280",
    totalIncome: 40000.00,
    deductibleExpenses: 0.00,
    isrBase: 40000.00,
    isrRate: "0.011",
    isrCalculated: 440.00,
    isrWithheld: 100.00,
    isrProvisional: 0.00,
    isrBalance: 340.00,
    ivaCharged: 6400.00,
    ivaCreditable: 1920.00,
    ivaBalance: 4480.00,
    invoices: [
      { id: 1, invoice: { id: "inv-9", internalFolio: "SERVI-006", invoiceDate: new Date("2026-03-15"), businessPartner: { businessName: "Servicios Profesionales S.A." }, total: 46400, paymentMethod: "PUE" }, appliedAccountCode: "401.01", includedAmount: 40000 },
      { id: 2, invoice: { id: "inv-10", internalFolio: "PAPEL-004", invoiceDate: new Date("2026-03-18"), businessPartner: { businessName: "Papelería del Centro S.A." }, total: 13920, paymentMethod: "PUE" }, appliedAccountCode: "601.12", includedAmount: 12000 }
    ],
    auditLogs: [
      { id: 1, action: "create", user: "Admin", timestamp: "2026-04-03T09:30:00Z", details: "Borrador de declaración generado automáticamente." },
      { id: 2, action: "validate", user: "Admin", timestamp: "2026-04-10T12:00:00Z", details: "Declaración verificada con éxito." },
      { id: 3, action: "file", user: "Admin", timestamp: "2026-04-17T11:15:00Z", details: "Declaración presentada ante el SAT con folio SAT-ACK-982347910280." }
    ]
  }
};

export function DeclarationDetailDemo({
  declarationId,
  onBack,
}: {
  declarationId: number;
  onBack: () => void;
}) {
  const declaration = mockDeclarations[declarationId] || mockDeclarations[101];

  const statusInfo = getStatusInfo(declaration.status || "");
  const isDraft = declaration.status === "draft";
  const isValidated = declaration.status === "validated";
  const isFiled = declaration.status === "filed";

  const regimeName =
    TAX_REGIMES.find((r) => r.code === declaration.taxRegime)?.description ||
    declaration.taxRegime;

  const declarationType =
    declaration.declarationType === "monthly" ? "mensual" : "anual";

  return (
    <div className="min-h-screen bg-background print:bg-white border border-border">
      {/* Navigation Bar */}
      <header className="border-b border-border bg-muted/20">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-mono text-xs tracking-wide uppercase"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            DECLARACIONES
          </button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs tracking-wide h-8 border-stone-300 bg-white hover:bg-stone-50"
              onClick={() => window.print()}
            >
              <FileDown className="h-3.5 w-3.5 mr-2" />
              EXPORTAR PDF
            </Button>
            {isDraft && (
              <Button
                size="sm"
                className="font-mono text-xs tracking-wide h-8 uppercase"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verificar y Bloquear Declaración
              </Button>
            )}
            {isValidated && (
              <Button
                size="sm"
                className="font-mono text-xs tracking-wide h-8 uppercase"
              >
                <Send className="h-4 w-4 mr-2" />
                Registrar Acuse SAT
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto py-8 px-6 print:py-0 print:px-0 max-w-5xl">
        {/* Report Header */}
        <header className="px-8 py-6 border-b border-foreground">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1">
                Declaración Fiscal Provisional
              </p>
              <h1 className="font-mono text-2xl tracking-tight text-foreground capitalize">
                {formatPeriod(declaration.fiscalPeriod)}
              </h1>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] tracking-wider uppercase",
                  statusInfo.className,
                )}
              >
                {statusInfo.icon}
                {statusInfo.text}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground mt-3">
                REF: DEC-{declaration.id.toString().padStart(6, "0")}
              </p>
            </div>
          </div>

          {/* Meta Information Row */}
          <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Régimen Fiscal
              </p>
              <p className="font-mono text-xs text-foreground mt-1 leading-relaxed">
                {regimeName}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Tipo
              </p>
              <p className="font-mono text-xs text-foreground mt-1 capitalize">
                {declarationType}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Fecha Generación
              </p>
              <p className="font-mono text-xs text-foreground mt-1">
                {format(declaration.createdAt, "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Facturas Incluidas
              </p>
              <p className="font-mono text-xs text-foreground mt-1">
                {declaration.invoices.length}
              </p>
            </div>
          </div>
        </header>

        {/* Main Report Content */}
        <div className="px-8 py-10 space-y-10">
          {/* ISR Section */}
          <section>
            <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2 mb-6">
              <h2 className="font-mono text-xs tracking-[0.2em] text-foreground uppercase">
                Impuesto Sobre la Renta
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                ISR
              </span>
            </div>

            <table className="w-full font-mono text-sm">
              <tbody>
                {/* Income */}
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground w-8">01</td>
                  <td className="py-3 text-foreground/90">
                    Ingresos Totales del Período
                  </td>
                  <td className="py-3 text-right tabular-nums text-foreground font-medium">
                    {formatCurrency(declaration.totalIncome)}
                  </td>
                </tr>

                {/* Deductible Expenses */}
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground">02</td>
                  <td className="py-3 text-foreground/90">
                    <span className="text-muted-foreground mr-1">(−)</span>
                    Gastos Deducibles Autorizados
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-600">
                    {formatCurrency(declaration.deductibleExpenses)}
                  </td>
                </tr>

                {/* ISR Base - highlighted */}
                <tr className="bg-muted/30 border-y border-border">
                  <td className="py-4 text-muted-foreground font-medium">03</td>
                  <td className="py-4 text-foreground font-medium">
                    Base Gravable para ISR
                  </td>
                  <td className="py-4 text-right tabular-nums text-foreground font-semibold text-base">
                    {formatCurrency(declaration.isrBase || 0)}
                  </td>
                </tr>

                {/* ISR Calculation */}
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground">04</td>
                  <td className="py-3 text-foreground/90">
                    ISR Determinado
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({(Number.parseFloat(declaration.isrRate || "0") * 100).toFixed(2)}%)
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums text-foreground">
                    {formatCurrency(declaration.isrCalculated || 0)}
                  </td>
                </tr>

                {/* Withholdings */}
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground">05</td>
                  <td className="py-3 text-foreground/90">
                    <span className="text-muted-foreground mr-1">(−)</span>
                    ISR Retenido por Terceros
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-600">
                    {formatCurrency(declaration.isrWithheld || 0)}
                  </td>
                </tr>

                {/* Provisional Payments */}
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground">06</td>
                  <td className="py-3 text-foreground/90">
                    <span className="text-muted-foreground mr-1">(−)</span>
                    Pagos Provisionales Anteriores
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-600">
                    {formatCurrency(declaration.isrProvisional || 0)}
                  </td>
                </tr>

                {/* ISR Balance */}
                <tr className="bg-foreground text-background">
                  <td
                    className="py-4 font-medium tracking-wide pl-3"
                    colSpan={2}
                  >
                    {Number(declaration.isrBalance || 0) >= 0 ? "ISR A PAGAR" : "ISR A FAVOR"}
                  </td>
                  <td className="py-4 pr-3 text-right tabular-nums font-bold text-lg">
                    {formatCurrency(Math.abs(Number(declaration.isrBalance || 0)))}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* IVA Section */}
          <section>
            <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2 mb-6">
              <h2 className="font-mono text-xs tracking-[0.2em] text-foreground uppercase">
                Impuesto al Valor Agregado
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                IVA
              </span>
            </div>

            <table className="w-full font-mono text-sm">
              <tbody>
                {/* IVA Charged */}
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground w-8">07</td>
                  <td className="py-3 text-foreground/90">
                    IVA Trasladado (Cobrado)
                  </td>
                  <td className="py-3 text-right tabular-nums text-foreground font-medium">
                    {formatCurrency(declaration.ivaCharged || 0)}
                  </td>
                </tr>

                {/* IVA Creditable */}
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground">08</td>
                  <td className="py-3 text-foreground/90">
                    <span className="text-muted-foreground mr-1">(−)</span>
                    IVA Acreditable
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-600">
                    {formatCurrency(declaration.ivaCreditable || 0)}
                  </td>
                </tr>

                {/* IVA Balance */}
                <tr className="bg-foreground text-background">
                  <td
                    className="py-4 font-medium tracking-wide pl-3"
                    colSpan={2}
                  >
                    {Number(declaration.ivaBalance || 0) >= 0 ? "IVA A PAGAR" : "IVA A FAVOR"}
                  </td>
                  <td className="py-4 pr-3 text-right tabular-nums font-bold text-lg">
                    {formatCurrency(Math.abs(Number(declaration.ivaBalance || 0)))}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Summary of Taxes */}
          <section className="border-2 border-foreground p-6 bg-muted/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1">
                  Resumen de Impuestos
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  Impuestos determinados para el período fiscal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-right sm:text-right w-full sm:w-auto justify-between sm:justify-end">
                {/* ISR Balance */}
                <div className="border-r border-border pr-8 last:border-0 last:pr-0">
                  <p className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                    ISR {Number(declaration.isrBalance || 0) >= 0 ? "A Pagar" : "A Favor"}
                  </p>
                  <p className={cn(
                    "font-mono text-2xl font-bold tracking-tight tabular-nums mt-0.5",
                    Number(declaration.isrBalance || 0) < 0 ? "text-emerald-600" : "text-foreground"
                  )}>
                    {formatCurrency(Math.abs(Number(declaration.isrBalance || 0)))}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    MXN
                  </p>
                </div>

                {/* IVA Balance */}
                <div className="pr-8 last:border-0 last:pr-0">
                  <p className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                    IVA {Number(declaration.ivaBalance || 0) >= 0 ? "A Pagar" : "A Favor"}
                  </p>
                  <p className={cn(
                    "font-mono text-2xl font-bold tracking-tight tabular-nums mt-0.5",
                    Number(declaration.ivaBalance || 0) < 0 ? "text-emerald-600" : "text-foreground"
                  )}>
                    {formatCurrency(Math.abs(Number(declaration.ivaBalance || 0)))}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    MXN
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Invoices Ledger */}
          <section className="pt-4">
            <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2 mb-6">
              <h2 className="font-mono text-xs tracking-[0.2em] text-foreground uppercase">
                Relación de Comprobantes
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                {declaration.invoices.length} REGISTROS
              </span>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b-2 border-border text-left">
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-medium">
                      Folio / ID
                    </th>
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-medium">
                      Fecha
                    </th>
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-medium">
                      Proveedor
                    </th>
                    <th className="pb-3 pr-4 text-[10px] text-right tracking-[0.15em] text-muted-foreground uppercase font-medium">
                      Cuenta
                    </th>
                    <th className="pb-3 pr-4 text-[10px] text-right tracking-[0.15em] text-muted-foreground uppercase font-medium">
                      Total Factura
                    </th>
                    <th className="pb-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-medium text-right">
                      Monto Considerado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {declaration.invoices.map((item: any) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {item.invoice.internalFolio}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground tabular-nums">
                        {format(item.invoice.invoiceDate, "dd/MM/yy")}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">
                        {item.invoice.businessPartner.businessName}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">
                        {item.appliedAccountCode}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(item.invoice.total)}
                      </td>
                      <td className="py-3 text-right tabular-nums text-foreground font-medium">
                        {formatCurrency(item.includedAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Report Footer */}
        <footer className="px-8 py-6 border-t border-border bg-muted/20">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Documento generado automáticamente
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Última actualización: {format(declaration.updatedAt, "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>

            {isFiled && declaration.acknowledgmentNumber && (
              <div className="text-right">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Acuse SAT
                </p>
                <p className="font-mono text-xs text-foreground font-medium">
                  {declaration.acknowledgmentNumber}
                </p>
                {declaration.filedAt && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">
                    Presentada: {format(declaration.filedAt, "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            )}
          </div>
        </footer>
      </section>

      {/* Audit Log */}
      <section className="bg-muted/10 border-t border-border p-8">
        <h3 className="font-mono text-xs tracking-wider uppercase text-foreground mb-4">
          Historial de Auditoría
        </h3>
        <div className="space-y-4">
          {declaration.auditLogs.map((log: any) => (
            <div key={log.id} className="flex gap-4 items-start text-xs font-mono">
              <span className="text-muted-foreground min-w-[120px]">
                {format(new Date(log.timestamp), "dd/MM/yy HH:mm")}
              </span>
              <span className="text-chart-4 font-semibold min-w-[80px] uppercase">
                [{log.action}]
              </span>
              <span className="text-muted-foreground min-w-[60px]">
                {log.user}
              </span>
              <span className="text-foreground">
                {log.details}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
