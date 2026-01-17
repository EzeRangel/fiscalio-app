import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Eye,
  FileText,
  CircleDashed,
  CircleDotDashed,
  CircleCheck,
  ClockFading,
} from "lucide-react";
import { getTaxDeclarationsDashboardData } from "@/data/tax-declarations";
import { getActiveOrganizationId } from "@/lib/session";
import { GenerateDraftButton } from "./_components/generate-draft-button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { PrivacyBlur } from "@/components/privacy-blur";
import { SummaryCards } from "./_components/summary-cards";
import { formatPeriod } from "./_utils/formatPeriod";

function getStatusInfo(status: string): {
  text: string;
  icon: React.ReactNode;
  className: string;
} {
  switch (status) {
    case "filed":
      return {
        text: "Presentada",
        icon: <CircleCheck className="h-4 w-4" />,
        className: "text-chart-4 bg-chart-4/10 border-chart-4/20",
      };
    case "validated":
      return {
        text: "Validada",
        icon: <CircleDotDashed className="h-4 w-4" />,
        className: "text-chart-1 bg-chart-1/10 border-chart-1/20",
      };
    case "draft":
      return {
        text: "Borrador",
        icon: <CircleDashed className="h-4 w-4" />,
        className: "text-muted-foreground bg-muted/50 border-muted",
      };
    default:
      return {
        text: "Pendiente",
        icon: <ClockFading className="h-4 w-4" />,
        className: "text-chart-2 bg-chart-2/10 border-chart-2/20",
      };
  }
}

export default async function TaxDeclarationsPage() {
  const organizationId = await getActiveOrganizationId();
  const dashboardData = await getTaxDeclarationsDashboardData(organizationId);

  const { currentPeriod, history } = dashboardData;
  const declaration = currentPeriod.declaration;
  const status = declaration?.status || "Pendiente de declarar";
  const currentStatusInfo = getStatusInfo(status);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Technical Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                Declaraciones Fiscales
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                Crea borradores, encuentra inconsistencias y revisa que todo
                vaya bien para tus declaraciones
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Período
                </div>
                <div className="text-sm font-medium font-mono mt-0.5">
                  {formatPeriod(currentPeriod.period)}
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs",
                  currentStatusInfo.className,
                )}
              >
                {currentStatusInfo.icon}
                {currentStatusInfo.text}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Metrics Grid */}
          <SummaryCards data={declaration!} currentPeriod={currentPeriod} />

          {/* Current Period Section */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-light tracking-tight">
                    Período Actual
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {formatPeriod(currentPeriod.period)} •{" "}
                    {currentPeriod.incomeInvoiceCount +
                      currentPeriod.expenseInvoiceCount}{" "}
                    documentos fiscales
                  </CardDescription>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs",
                    currentStatusInfo.className,
                  )}
                >
                  {currentStatusInfo.icon}
                  {currentStatusInfo.text}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Summary Bars */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">
                        Ingresos
                      </span>
                      <span className="font-mono font-medium text-chart-4">
                        <PrivacyBlur>{formatCurrency(totalIncome)}</PrivacyBlur>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-4 rounded-full transition-all"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">
                        Egresos
                      </span>
                      <span className="font-mono font-medium text-chart-3">
                        <PrivacyBlur>
                          {formatCurrency(totalExpenses)}
                        </PrivacyBlur>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-3 rounded-full transition-all"
                        style={{
                          width: `${(totalExpenses / totalIncome) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">
                        Utilidad Neta
                      </span>
                      <span className="font-mono font-semibold text-primary">
                        <PrivacyBlur>{formatCurrency(netAmount)}</PrivacyBlur>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Area */}
                <div className="flex items-center justify-center border border-dashed border-border rounded-lg p-6">
                  <div className="text-center space-y-4">
                    {currentPeriod.declaration ? (
                      <>
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-chart-4/10 border border-chart-4/20">
                          <CheckCircle2 className="h-6 w-6 text-chart-4" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Declaración Generada
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Lista para revisión y presentación
                          </p>
                        </div>
                        <Link
                          href={`/tax-declarations/${currentPeriod.declaration.id}`}
                        >
                          <Button size="lg" className="gap-2 font-mono">
                            <Eye className="h-4 w-4" />
                            Revisar Declaración
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted border border-border">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Sin Declaración</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Genera el borrador para este período
                          </p>
                        </div>
                        <GenerateDraftButton
                          period={currentPeriod.period}
                          declarationType="monthly"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Section */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-light tracking-tight">
                    Historial de Declaraciones
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Declaraciones presentadas anteriormente
                  </CardDescription>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {history.length} declaraciones
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((declaration) => (
                    <div
                      key={declaration.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-chart-4/10 border border-chart-4/20 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-chart-4" />
                        </div>
                        <div>
                          <div className="font-medium font-mono text-sm">
                            {formatPeriod(declaration.fiscalPeriod)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
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
                        className="gap-2 font-mono"
                        asChild
                      >
                        <Link href={`/tax-declarations/${declaration.id}`}>
                          <Eye className="h-4 w-4" />
                          Ver
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted border border-border mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground font-mono">
                    No hay declaraciones en el historial
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
