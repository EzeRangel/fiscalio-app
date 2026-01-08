import { notFound } from "next/navigation";
import { getTaxDeclarationById } from "@/data/tax-declarations";
import { getActiveOrganizationId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRightIcon,
  ChevronsRightIcon,
  FileDown,
  FileText,
  List,
  XCircle,
} from "lucide-react";
import { ValidateDeclarationButton } from "./_components/validate-declaration-button";
import { getStatusInfo } from "../_utils/getStatusInfo";
import { formatPeriod } from "../_utils/formatPeriod";
import { formatCurrency } from "../_utils/formatCurrency";
import { getDeclarationInvoicesById } from "@/data/declaration-invoices";
import { getIvaTypeLabel } from "../_utils/getIvaTypeLabel";
import { FileDeclarationDialog } from "../_components/file-declaration-dialog";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getData(declarationId: number) {
  const organizationId = await getActiveOrganizationId();
  const declaration = await getTaxDeclarationById(
    declarationId,
    organizationId
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
          : "bg-chart-2/5 border-chart-2/20"
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

  const { declaration, invoices: declarationInvoices } = await getData(
    declarationId
  );

  const statusInfo =
    declaration.status === null
      ? getStatusInfo("")
      : getStatusInfo(declaration.status);

  const isDraft = declaration.status === "draft";
  const isValidated = declaration.status === "validated";
  const isFiled = declaration.status === "filed";

  const declarationType =
    declaration.declarationType === "monthly" ? "mensual" : "anual";

  return (
    <div className="min-h-screen bg-background">
      {/* Technical Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                Declaración {formatPeriod(declaration.fiscalPeriod)}
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                {`Un detalle profundo sobre tu declaración ${declarationType}`}
              </p>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm",
                statusInfo.className
              )}
            >
              {statusInfo.icon}
              {statusInfo.text}
            </div>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* ISR Section */}
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-light tracking-tight">
                    Impuesto Sobre la Renta (ISR)
                  </CardTitle>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Impuesto sobre ingresos
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Income */}
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground font-mono">
                    Ingresos Totales
                  </span>
                  <span className="text-lg font-mono font-medium text-chart-4">
                    {formatCurrency(declaration.totalIncome)}
                  </span>
                </div>

                {/* Expenses */}
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground font-mono">
                    (-) Gastos Deducibles
                  </span>
                  <span className="text-lg font-mono font-medium text-chart-3">
                    {formatCurrency(declaration.deductibleExpenses)}
                  </span>
                </div>

                {/* Base */}
                <div className="flex items-center justify-between py-4 bg-muted/30 rounded-lg px-4 border border-border/50">
                  <span className="text-sm font-medium font-mono">
                    Base Gravable ISR
                  </span>
                  <span className="text-xl font-mono font-semibold text-primary">
                    {formatCurrency(declaration.isrBase || 0)}
                  </span>
                </div>

                {/* ISR Calculation */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground font-mono">
                      ISR Calculado (
                      {(
                        Number.parseFloat(declaration.isrRate || "0") * 100
                      ).toFixed(2)}
                      %)
                    </span>
                    <span className="text-lg font-mono font-medium">
                      {formatCurrency(declaration.isrCalculated || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground font-mono">
                      (-) Retenciones
                    </span>
                    <span className="text-lg font-mono font-medium">
                      {formatCurrency(declaration.isrWithheld || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground font-mono">
                      (-) Pagos Provisionales
                    </span>
                    <span className="text-lg font-mono font-medium">
                      {formatCurrency(declaration.isrProvisional || 0)}
                    </span>
                  </div>
                </div>

                {/* ISR Balance */}
                <div className="flex items-center justify-between py-4 bg-chart-3/5 border border-chart-3/20 rounded-lg px-4 mt-4">
                  <span className="text-sm font-semibold font-mono">
                    ISR a Pagar
                  </span>
                  <span className="text-2xl font-mono font-bold text-chart-3">
                    {formatCurrency(declaration.isrBalance || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* IVA Section */}
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-light tracking-tight">
                    Impuesto al Valor Agregado (IVA)
                  </CardTitle>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Impuesto de IVA
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* IVA Charged */}
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground font-mono">
                    IVA Cobrado
                  </span>
                  <span className="text-lg font-mono font-medium text-chart-4">
                    {formatCurrency(declaration.ivaCharged || 0)}
                  </span>
                </div>

                {/* IVA Creditable */}
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground font-mono">
                    (-) IVA Acreditable
                  </span>
                  <span className="text-lg font-mono font-medium text-chart-3">
                    {formatCurrency(declaration.ivaCreditable || 0)}
                  </span>
                </div>

                {/* IVA Balance */}
                <div className="flex items-center justify-between py-4 bg-chart-3/5 border border-chart-3/20 rounded-lg px-4 mt-4">
                  <span className="text-sm font-semibold font-mono">
                    IVA a Pagar
                  </span>
                  <span className="text-2xl font-mono font-bold text-chart-3">
                    {formatCurrency(declaration.ivaBalance || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Invoices Section */}
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="gap-3">
                    <CardTitle className="text-lg font-light tracking-tight">
                      Facturas Incluidas
                    </CardTitle>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      {declarationInvoices.length} facturas
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <ChevronRightIcon className="h-4 w-4 text-primary" />
                  </Button>
                  {/* <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"></div> */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {declarationInvoices.map((item) => {
                    const ivaTypeInfo = getIvaTypeLabel(item.ivaType);
                    return (
                      <a
                        key={item.id}
                        href={`/invoices/${item.invoice.id}`}
                        className="block border border-border rounded-lg p-4 bg-card/30 hover:bg-card/70 hover:border-primary/30 transition-all duration-200 group"
                      >
                        {/* Invoice Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
                                {item.invoice.folioFiscal}
                              </span>
                              {item.wasManuallyAdjusted && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-chart-2/10 border border-chart-2/20 text-chart-2">
                                  Ajustado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.invoice.businessPartner?.businessName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {format(
                                new Date(item.invoice.invoiceDate),
                                "dd MMM yyyy",
                                { locale: es }
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-mono font-semibold text-foreground">
                              {formatCurrency(item.invoice.total)}
                            </p>
                          </div>
                        </div>

                        {/* Classification */}
                        <div className="bg-muted/30 rounded-lg p-3 mb-3 border border-border/50">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground font-mono">
                              Cuenta Contable
                            </span>
                            <span className="font-mono font-medium">
                              {item.appliedAccountCode}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.appliedAccountName}
                          </p>
                        </div>

                        {/* Financial Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {/* Deduction Status */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-mono">
                                Deducible
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-mono px-2 py-0.5 rounded border",
                                  item.isDeductible
                                    ? "text-chart-4 bg-chart-4/10 border-chart-4/20"
                                    : "text-muted-foreground bg-muted/50 border-muted"
                                )}
                              >
                                {item.isDeductible ? "Sí" : "No"}
                              </span>
                            </div>
                            {item.isDeductible && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-mono">
                                  Porcentaje
                                </span>
                                <span className="text-xs font-mono font-medium">
                                  {Number.parseFloat(
                                    item.deductionPercentage
                                  ).toFixed(0)}
                                  %
                                </span>
                              </div>
                            )}
                          </div>

                          {/* IVA Type */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-mono">
                                Tipo IVA
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-mono px-2 py-0.5 rounded border capitalize",
                                  ivaTypeInfo.className
                                )}
                              >
                                {ivaTypeInfo.text}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-mono">
                                Monto IVA
                              </span>
                              <span className="text-xs font-mono font-medium">
                                {formatCurrency(item.ivaAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amounts Summary */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground font-mono mb-1">
                              Incluido
                            </p>
                            <p className="text-sm font-mono font-medium">
                              {formatCurrency(item.includedAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-mono mb-1">
                              Deducible
                            </p>
                            <p className="text-sm font-mono font-medium text-chart-4">
                              {formatCurrency(item.deductibleAmount)}
                            </p>
                          </div>
                        </div>

                        {/* Manual Adjustment Warning */}
                        {item.wasManuallyAdjusted && item.adjustmentReason && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-3 w-3 text-chart-2 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                {item.adjustmentReason}
                              </p>
                            </div>
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                disabled
                className="gap-2 font-mono flex-1 bg-transparent"
              >
                <FileDown className="h-4 w-4" />
                Descargar Archivo SAT
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Validations Card */}
            {declaration.aiValidations &&
              declaration.aiValidations.length > 0 && (
                <Card className="border-chart-2/30 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-chart-2/10 border border-chart-2/20 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-chart-2" />
                      </div>
                      <CardTitle className="text-base font-light tracking-tight">
                        Validaciones
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {declaration.aiValidations.map((v: any, i: number) => (
                        <ValidationItem
                          key={i}
                          severity={v.severity}
                          message={v.message}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Summary Card */}
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base font-light tracking-tight">
                  Resumen de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                      ISR
                    </span>
                    <span className="text-sm font-mono font-medium">
                      {formatCurrency(declaration.isrBalance || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                      IVA
                    </span>
                    <span className="text-sm font-mono font-medium">
                      {formatCurrency(declaration.ivaBalance || 0)}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold font-mono">
                      Total a Pagar
                    </span>
                    <span className="text-xl font-mono font-bold text-chart-3">
                      {formatCurrency(
                        Number.parseFloat(declaration.isrBalance) +
                          Number.parseFloat(declaration.ivaBalance)
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">
                      Régimen Fiscal
                    </span>
                    <span className="font-mono">{declaration.taxRegime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">
                      Tipo
                    </span>
                    <span className="font-mono capitalize">
                      {declaration.declarationType}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filing Status and Actions */}
            {isFiled && declaration.acknowledgmentNumber && (
              <div className="pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-chart-4 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">
                      Presentada
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground font-mono mb-1">
                      Número de Acuse
                    </p>
                    <p className="text-sm font-mono font-medium break-all">
                      {declaration.acknowledgmentNumber}
                    </p>
                  </div>
                  {declaration.filedAt && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(
                        new Date(declaration.filedAt),
                        "dd MMM yyyy, HH:mm",
                        { locale: es }
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base font-light tracking-tight">
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                  Una vez validada, la declaración no podrá ser modificada.
                  Asegúrate de revisar todos los datos antes de continuar.
                </p>

                {isDraft && (
                  <ValidateDeclarationButton declarationId={declarationId} />
                )}

                {isValidated && (
                  <FileDeclarationDialog declarationId={declarationId} />
                )}

                {!isDraft && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 font-mono bg-transparent"
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}
