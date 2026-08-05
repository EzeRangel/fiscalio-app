import { notFound } from "next/navigation";
import { getTaxDeclarationById } from "@/data/tax-declarations";
import { getActiveOrganizationId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeftIcon,
  FileDown,
  PrinterIcon,
  XCircle,
} from "lucide-react";
import { ValidateDeclarationButton } from "./_components/validate-declaration-button";
import { getStatusInfo } from "../_utils/getStatusInfo";
import { formatPeriod } from "../_utils/formatPeriod";
import { formatCurrency } from "@/lib/utils";
import { getDeclarationInvoicesById } from "@/data/declaration-invoices";
import { FileDeclarationDialog } from "../_components/file-declaration-dialog";
import { EntityAuditLog } from "@/components/EntityAuditLog";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getData(declarationId: number) {
  const organizationId = await getActiveOrganizationId();
  const declaration = await getTaxDeclarationById(
    declarationId,
    organizationId,
  );

  if (!declaration) {
    notFound();
  }

  const invoices = await getDeclarationInvoicesById(declarationId);

  return {
    declaration,
    invoices,
  };
}

function ValidationItem({
  severity,
  message,
}: {
  severity: string;
  message: string;
}) {
  const icon =
    severity === "error" ? (
      <XCircle className="h-4 w-4 text-chart-3" />
    ) : (
      <AlertCircle className="h-4 w-4 text-chart-2" />
    );

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        severity === "error"
          ? "bg-chart-3/5 border-chart-3/20"
          : "bg-chart-2/5 border-chart-2/20",
      )}
    >
      <div className="mt-0.5">{icon}</div>
      <span className="text-sm flex-1">{message}</span>
    </div>
  );
}

export default async function TaxDeclarationReviewPage({
  params: paramsPromise,
}: PageProps) {
  const params = await paramsPromise; // Await the params promise
  const declarationId = parseInt(params.id, 10);
  if (isNaN(declarationId)) {
    notFound();
  }

  const { declaration, invoices: declarationInvoices } =
    await getData(declarationId);

  const statusInfo =
    declaration.status === null
      ? getStatusInfo("")
      : getStatusInfo(declaration.status);

  const isDraft = declaration.status === "draft";
  const isValidated = declaration.status === "validated";
  const isFiled = declaration.status === "filed";

  const declarationType =
    declaration.declarationType === "monthly" ? "mensual" : "anual";

  const totalToPay =
    Number.parseFloat(declaration.isrBalance || "0") +
    Number.parseFloat(declaration.ivaBalance || "0");

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Report Navigation Bar */}
      <header className="border-b border-stone-200 print:hidden">
        <div className="px-8 py-4 flex items-center justify-between">
          <Link
            href="/tax-declarations"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-mono text-xs tracking-wide"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            DECLARACIONES
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs tracking-wide h-8 border-stone-300 bg-white hover:bg-stone-50"
            >
              <PrinterIcon className="h-3.5 w-3.5 mr-2" />
              IMPRIMIR
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs tracking-wide h-8 border-stone-300 bg-white hover:bg-stone-50"
            >
              <FileDown className="h-3.5 w-3.5 mr-2" />
              EXPORTAR PDF
            </Button>
            {isDraft && (
              <ValidateDeclarationButton declarationId={declarationId} />
            )}
            {isValidated && (
              <FileDeclarationDialog declarationId={declarationId} />
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto py-8 px-4 print:py-0 print:px-0">
        {/* Report Header */}
        <header className="px-12 py-8 border-b border-stone-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-1">
                Declaración Fiscal Provisional
              </p>
              <h1 className="font-mono text-2xl tracking-tight text-stone-900 capitalize">
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
              <p className="font-mono text-[10px] text-stone-400 mt-3">
                REF: DEC-{declaration.id.toString().padStart(6, "0")}
              </p>
            </div>
          </div>

          {/* Meta Information Row */}
          <div className="mt-8 pt-6 border-t border-stone-200 grid grid-cols-4 gap-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-stone-400 uppercase">
                Régimen Fiscal
              </p>
              <p className="font-mono text-sm text-stone-900 mt-1">
                {declaration.taxRegime}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-stone-400 uppercase">
                Tipo
              </p>
              <p className="font-mono text-sm text-stone-900 mt-1 capitalize">
                {declarationType}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-stone-400 uppercase">
                Fecha Generación
              </p>
              <p className="font-mono text-sm text-stone-900 mt-1">
                {format(declaration.createdAt!, "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-stone-400 uppercase">
                Facturas Incluidas
              </p>
              <p className="font-mono text-sm text-stone-900 mt-1">
                {declarationInvoices.length}
              </p>
            </div>
          </div>
        </header>

        {/* Main Report Content */}
        <div className="px-12 py-10 space-y-10">
          {/* ISR Section */}
          <section>
            <div className="flex items-baseline justify-between border-b-2 border-stone-900 pb-2 mb-6">
              <h2 className="font-mono text-xs tracking-[0.2em] text-stone-900 uppercase">
                Impuesto Sobre la Renta
              </h2>
              <span className="font-mono text-[10px] text-stone-400 tracking-wider">
                ISR
              </span>
            </div>

            <table className="w-full font-mono text-sm">
              <tbody>
                {/* Income */}
                <tr className="border-b border-stone-100">
                  <td className="py-3 text-stone-500 w-8">01</td>
                  <td className="py-3 text-stone-700">
                    Ingresos Totales del Período
                  </td>
                  <td className="py-3 text-right tabular-nums text-stone-900 font-medium">
                    {formatCurrency(declaration.totalIncome)}
                  </td>
                </tr>

                {/* Deductible Expenses */}
                <tr className="border-b border-stone-100">
                  <td className="py-3 text-stone-500">02</td>
                  <td className="py-3 text-stone-700">
                    <span className="text-stone-400 mr-1">(−)</span>
                    Gastos Deducibles Autorizados
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-700">
                    {formatCurrency(declaration.deductibleExpenses)}
                  </td>
                </tr>

                {/* ISR Base - highlighted */}
                <tr className="bg-stone-50 border-y border-stone-200">
                  <td className="py-4 text-stone-500 font-medium">03</td>
                  <td className="py-4 text-stone-900 font-medium">
                    Base Gravable para ISR
                  </td>
                  <td className="py-4 text-right tabular-nums text-stone-900 font-semibold text-base">
                    {formatCurrency(declaration.isrBase || 0)}
                  </td>
                </tr>

                {/* ISR Calculation */}
                <tr className="border-b border-stone-100">
                  <td className="py-3 text-stone-500">04</td>
                  <td className="py-3 text-stone-700">
                    ISR Determinado
                    <span className="text-stone-400 ml-2 text-xs">
                      (
                      {(
                        Number.parseFloat(declaration.isrRate || "0") * 100
                      ).toFixed(0)}
                      %)
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums text-stone-900">
                    {formatCurrency(declaration.isrCalculated || 0)}
                  </td>
                </tr>

                {/* Withholdings */}
                <tr className="border-b border-stone-100">
                  <td className="py-3 text-stone-500">05</td>
                  <td className="py-3 text-stone-700">
                    <span className="text-stone-400 mr-1">(−)</span>
                    ISR Retenido por Terceros
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-700">
                    {formatCurrency(declaration.isrWithheld || 0)}
                  </td>
                </tr>

                {/* Provisional Payments */}
                <tr className="border-b border-stone-100">
                  <td className="py-3 text-stone-500">06</td>
                  <td className="py-3 text-stone-700">
                    <span className="text-stone-400 mr-1">(−)</span>
                    Pagos Provisionales Anteriores
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-700">
                    {formatCurrency(declaration.isrProvisional || 0)}
                  </td>
                </tr>

                {/* ISR Balance */}
                <tr className="bg-stone-900 text-stone-50">
                  <td
                    className="py-4 font-medium tracking-wide pl-3"
                    colSpan={2}
                  >
                    ISR A PAGAR
                  </td>
                  <td className="py-4 pr-3 text-right tabular-nums font-bold text-lg">
                    {formatCurrency(declaration.isrBalance || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* IVA Section */}
          <section>
            <div className="flex items-baseline justify-between border-b-2 border-stone-900 pb-2 mb-6">
              <h2 className="font-mono text-xs tracking-[0.2em] text-stone-900 uppercase">
                Impuesto al Valor Agregado
              </h2>
              <span className="font-mono text-[10px] text-stone-400 tracking-wider">
                IVA
              </span>
            </div>

            <table className="w-full font-mono text-sm">
              <tbody>
                {/* IVA Charged */}
                <tr className="border-b border-stone-100">
                  <td className="py-3 text-stone-500 w-8">07</td>
                  <td className="py-3 text-stone-700">
                    IVA Trasladado (Cobrado)
                  </td>
                  <td className="py-3 text-right tabular-nums text-stone-900 font-medium">
                    {formatCurrency(declaration.ivaCharged || 0)}
                  </td>
                </tr>

                {/* IVA Creditable */}
                <tr className="border-b border-stone-100">
                  <td className="py-3 text-stone-500">08</td>
                  <td className="py-3 text-stone-700">
                    <span className="text-stone-400 mr-1">(−)</span>
                    IVA Acreditable
                  </td>
                  <td className="py-3 text-right tabular-nums text-red-700">
                    {formatCurrency(declaration.ivaCreditable || 0)}
                  </td>
                </tr>

                {/* IVA Balance */}
                <tr className="bg-stone-900 text-stone-50">
                  <td
                    className="py-4 font-medium tracking-wide pl-3"
                    colSpan={2}
                  >
                    IVA A PAGAR
                  </td>
                  <td className="py-4 pr-3 text-right tabular-nums font-bold text-lg">
                    {formatCurrency(declaration.ivaBalance || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Grand Total */}
          <section className="border-2 border-stone-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-1">
                  Total de Contribuciones
                </p>
                <p className="font-mono text-xs text-stone-500">
                  ISR {formatCurrency(declaration.isrBalance || 0)} + IVA{" "}
                  {formatCurrency(declaration.ivaBalance || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-3xl font-bold tracking-tight text-stone-900 tabular-nums">
                  {formatCurrency(totalToPay)}
                </p>
                <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider mt-1">
                  MXN
                </p>
              </div>
            </div>
          </section>

          {/* Invoices Ledger */}
          <section className="pt-4">
            <div className="flex items-baseline justify-between border-b-2 border-stone-900 pb-2 mb-6">
              <h2 className="font-mono text-xs tracking-[0.2em] text-stone-900 uppercase">
                Relación de Comprobantes
              </h2>
              <span className="font-mono text-[10px] text-stone-400 tracking-wider">
                {declarationInvoices.length} REGISTROS
              </span>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-left">
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-stone-500 uppercase font-medium">
                      Folio
                    </th>
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-stone-500 uppercase font-medium">
                      Fecha
                    </th>
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-stone-500 uppercase font-medium">
                      Proveedor
                    </th>
                    <th className="pb-3 pr-4 text-[10px] text-right tracking-[0.15em] text-stone-500 uppercase font-medium">
                      Cuenta
                    </th>
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-stone-500 uppercase font-medium text-right">
                      Subtotal
                    </th>
                    <th className="pb-3 pr-4 text-[10px] tracking-[0.15em] text-stone-500 uppercase font-medium text-right">
                      IVA
                    </th>
                    <th className="pb-3 text-[10px] tracking-[0.15em] text-stone-500 uppercase font-medium text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {declarationInvoices.map((item: any, index: number) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "group hover:bg-stone-50 transition-colors",
                        item.wasManuallyAdjusted && "bg-amber-50/30",
                      )}
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/invoice-details?id=${item.invoice.id}`}
                          className="text-stone-900 hover:text-stone-600 transition-colors font-medium"
                        >
                          {item.invoice.folio}
                          {item.wasManuallyAdjusted && (
                            <span className="ml-1.5 text-amber-600">*</span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-stone-600 tabular-nums">
                        {format(item.invoice.invoiceDate, "dd/MM/yy")}
                      </td>
                      <td className="py-3 pr-4 text-stone-700 max-w-[200px] truncate">
                        {item.invoice.businessPartner.businessName}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-stone-500">
                          {item.appliedAccountCode}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-stone-900">
                        {formatCurrency(item.includedAmount)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-stone-600">
                        {formatCurrency(item.ivaAmount)}
                      </td>
                      <td className="py-3 text-right tabular-nums text-stone-900 font-medium">
                        {formatCurrency(item.invoice.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-300 font-medium">
                    <td
                      colSpan={4}
                      className="pt-4 pb-2 text-stone-500 text-[10px] uppercase tracking-wider"
                    >
                      Totales
                    </td>
                    <td className="pt-4 pb-2 text-right tabular-nums text-stone-900">
                      {formatCurrency(
                        declarationInvoices.reduce(
                          (sum, i) => sum + parseFloat(i.includedAmount),
                          0,
                        ),
                      )}
                    </td>
                    <td className="pt-4 pb-2 text-right tabular-nums text-stone-600">
                      {formatCurrency(
                        declarationInvoices.reduce(
                          (sum, i) => sum + parseFloat(i.ivaAmount || "0"),
                          0,
                        ),
                      )}
                    </td>
                    <td className="pt-4 pb-2 text-right tabular-nums text-stone-900 font-semibold">
                      {formatCurrency(
                        declarationInvoices.reduce(
                          (sum, i) => sum + parseFloat(i.invoice.total),
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Ledger footnote */}
            {declarationInvoices.some((i) => i.wasManuallyAdjusted) && (
              <p className="mt-4 font-mono text-[10px] text-stone-400">
                * Comprobante con ajuste manual aplicado
              </p>
            )}
          </section>
        </div>

        {/* Report Footer */}
        <footer className="px-12 py-8 border-t border-stone-200 bg-stone-50/50">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                Documento generado automáticamente
              </p>
              <p className="font-mono text-[10px] text-stone-400">
                Última actualización:{" "}
                {format(declaration.updatedAt!, "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </p>
            </div>

            {isFiled && declaration.acknowledgmentNumber && (
              <div className="text-right">
                <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider mb-1">
                  Acuse SAT
                </p>
                <p className="font-mono text-xs text-stone-700 font-medium">
                  {declaration.acknowledgmentNumber}
                </p>
                {declaration.filedAt && (
                  <p className="font-mono text-[10px] text-stone-400 mt-1">
                    Presentada:{" "}
                    {format(new Date(declaration.filedAt), "dd/MM/yyyy HH:mm", {
                      locale: es,
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Page indicator for print */}
          <div className="mt-8 pt-4 border-t border-stone-200 flex justify-center">
            <p className="font-mono text-[10px] text-stone-300 tracking-widest">
              — 1 / 1 —
            </p>
          </div>
        </footer>
      </section>

      <EntityAuditLog entityType="tax_declaration" entityId={declarationId} />
    </div>
  );
}
