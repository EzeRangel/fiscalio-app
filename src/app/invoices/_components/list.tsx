"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/hooks/usePrice";
import { getInvoiceType } from "@/lib/utils";
import { InvoiceDetails } from "@/types/invoices";
import { Eye, FileText, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { PrivacyBlur } from "@/components/privacy-blur";
import { INVOICE_TYPE, INVOICE_TYPE_COLOR } from "@/lib/constants";
import {
  calculateCashBasisSummary,
  getEffectiveExchangeRate,
} from "@/lib/cash-basis-utils";

interface Props {
  periodGroup?: "month" | "year" | "none";
  invoices: InvoiceDetails[];
}

const getPaymentStatus = (total: number, paid: number) => {
  if (paid <= 0)
    return {
      label: "Pendiente",
      color: "bg-red-500/10 text-red-700 border-red-500/20",
    };
  if (paid >= total)
    return {
      label: "Pagado",
      color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    };
  return {
    label: "Parcial",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  };
};

const calculateInvoicePaid = (invoice: InvoiceDetails) => {
  const invoiceAllocations = invoice.allocations.map((i) => {
    const finalRate = getEffectiveExchangeRate(
      invoice.currency,
      i.exchangeRate,
      invoice.exchangeRate,
    );

    return {
      amountAllocated: i.amountAllocated,
      exchangeRate: finalRate,
      invoice: {
        total: invoice.total,
        subtotal: invoice.subtotal ?? invoice.total,
        taxes: [],
      },
    };
  });

  const summary = calculateCashBasisSummary(invoiceAllocations);

  return summary.totalPaid;
};

export default function List({ invoices, periodGroup = "none" }: Props) {
  const filteredInvoices = invoices;

  const groupedInvoices =
    periodGroup === "none"
      ? { all: filteredInvoices }
      : filteredInvoices.reduce(
          (acc, invoice) => {
            let key = "";
            const date = new Date(invoice.invoiceDate);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const periodFromDate = `${year}-${month}`;

            if (periodGroup === "month") {
              key = invoice.accountingPeriod || periodFromDate;
            } else if (periodGroup === "year") {
              key =
                invoice.accountingPeriod?.substring(0, 4) || year.toString();
            }
            if (!acc[key]) acc[key] = [];
            acc[key].push(invoice);
            return acc;
          },
          {} as Record<string, InvoiceDetails[]>,
        );

  const calculatePeriodTotals = (periodInvoices: InvoiceDetails[]) => {
    // Cash-basis totals for the period
    let income = 0;
    let expense = 0;

    periodInvoices.forEach((inv) => {
      const paid = calculateInvoicePaid(inv);
      if (
        inv.invoiceType === "income" ||
        inv.invoiceType === "credit_note_received" ||
        inv.invoiceType === "payment_received" ||
        inv.invoiceType === "payroll_received" ||
        inv.invoiceType === "transfer_received"
      ) {
        income += paid;
      } else {
        expense += paid;
      }
    });

    return { income, expense, net: income - expense };
  };

  const formatPeriodLabel = (period: string) => {
    if (period === "Sin periodo") return period;
    if (periodGroup === "month") {
      const [year, month] = period.split("-");
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1);
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
      });
    }
    return period;
  };

  const hasInvoices = Object.keys(groupedInvoices).length > 0;

  if (!hasInvoices) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg text-muted-foreground">
          No se encontraron facturas
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Intenta ajustar los filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(groupedInvoices)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([period, invoices]) => {
          const totals = calculatePeriodTotals(invoices);

          return (
            <div
              key={period}
              className="space-y-6 animate-fade-in animate-duration-500"
            >
              {/* Period Header */}
              {periodGroup !== "none" && (
                <div className="flex items-baseline justify-between pb-4 border-b-2 border-primary/20">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-light tracking-tight">
                      {formatPeriodLabel(period)}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      {invoices.length}{" "}
                      {invoices.length === 1 ? "factura" : "facturas"}
                    </p>
                  </div>

                  <div className="flex gap-8 text-sm">
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                        Ingresos (Cobrado)
                      </div>
                      <div className="font-mono text-lg font-medium text-emerald-600 dark:text-emerald-400">
                        <PrivacyBlur>
                          {formatPrice(totals.income, 2)}
                        </PrivacyBlur>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                        Egresos (Pagado)
                      </div>
                      <div className="font-mono text-lg font-medium text-red-600 dark:text-red-400">
                        <PrivacyBlur>
                          {formatPrice(totals.expense, 2)}
                        </PrivacyBlur>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                        Efectivo Neto
                      </div>
                      <div className="font-mono text-lg font-medium">
                        <PrivacyBlur>{formatPrice(totals.net, 2)}</PrivacyBlur>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs uppercase tracking-widest font-medium w-[100px]">
                        Folio
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium">
                        Emisor / Receptor
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium w-[140px]">
                        Fecha
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium w-[100px]">
                        Tipo
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium w-[120px]">
                        Pago
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium text-right w-[140px]">
                        Facturado
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium text-right w-[140px]">
                        Cobrado/Pagado
                      </TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const totalPaid = calculateInvoicePaid(invoice);
                      const status = getPaymentStatus(
                        Number(invoice.total),
                        totalPaid,
                      );

                      return (
                        <TableRow
                          key={invoice.id}
                          className="group cursor-pointer"
                        >
                          <TableCell className="font-mono text-sm font-medium">
                            {invoice.internalFolio}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium leading-none">
                                {invoice.businessPartner?.legalName}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                <PrivacyBlur>
                                  {invoice.businessPartner?.rfc}
                                </PrivacyBlur>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            <time
                              dateTime={new Date(
                                invoice.invoiceDate,
                              ).toISOString()}
                            >
                              {new Date(invoice.invoiceDate).toLocaleDateString(
                                "es-MX",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </time>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                // @ts-expect-error keyof typing
                                INVOICE_TYPE_COLOR[invoice.invoiceType] ||
                                "bg-gray-500/10"
                              }
                            >
                              {getInvoiceType(
                                invoice.invoiceType as keyof typeof INVOICE_TYPE,
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs ${status.color}`}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-mono text-muted-foreground">
                              <PrivacyBlur>
                                {formatPrice(Number(invoice.total), 2)}
                              </PrivacyBlur>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {invoice.currency}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-mono text-sm font-medium">
                              <PrivacyBlur>
                                {formatPrice(totalPaid, 2)}
                              </PrivacyBlur>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {invoice.currency}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4" />
                                  <Link href={`/invoices/${invoice.id}`}>
                                    Ver detalles
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4" />
                                  Descargar XML
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
    </div>
  );
}
