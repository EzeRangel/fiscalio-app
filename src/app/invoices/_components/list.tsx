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
import { getCFDIType } from "@/lib/utils";
import { Invoice } from "@/types/invoices";
import { InferResultType } from "@/types/orm";
import { Download, Eye, FileText, MoreHorizontal } from "lucide-react";
import Link from "next/link";

type InvoiceWithContacts = InferResultType<
  "invoices",
  { businessPartner: true }
>;

interface Props {
  search?: string;
  filterType?: string;
  periodGroup?: "month" | "year" | "none";
  invoices: InvoiceWithContacts[];
}

export default function List({
  invoices,
  search,
  filterType,
  periodGroup = "none",
}: Props) {
  // TODO: Filter invoices
  // const filteredInvoices = invoices.filter((invoice) => {
  //   if (!search) {
  //     return false;
  //   }

  //   const matchesSearch =
  //     invoice.businessPartner?.rfc
  //       .toLowerCase()
  //       .includes(search?.toLowerCase()) ||
  //     invoice.businessPartner?.legalName
  //       ?.toLowerCase()
  //       .includes(search?.toLowerCase()) ||
  //     invoice?.internalFolio?.toLowerCase().includes(search?.toLowerCase());

  //   const matchesType = filterType === "all" || invoice.cfdiType === filterType;

  //   return matchesSearch && matchesType;
  // });

  const filteredInvoices = invoices;

  const groupedInvoices =
    periodGroup === "none"
      ? { all: filteredInvoices }
      : filteredInvoices.reduce((acc, invoice) => {
          let key = "";
          if (periodGroup === "month") {
            key = invoice.accountingPeriod || "Sin periodo";
          } else if (periodGroup === "year") {
            key = invoice.accountingPeriod?.substring(0, 4) || "Sin periodo";
          }
          if (!acc[key]) acc[key] = [];
          acc[key].push(invoice);
          return acc;
        }, {} as Record<string, InvoiceWithContacts[]>);

  const calculatePeriodTotals = (invoices: Invoice[]) => {
    const income = invoices
      .filter((inv) => inv.cfdiType === "Ingreso")
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    const expense = invoices
      .filter((inv) => inv.cfdiType === "Egreso")
      .reduce((sum, inv) => sum + Math.abs(Number(inv.total)), 0);
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
            <div key={period} className="space-y-6">
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
                        Ingresos
                      </div>
                      <div className="font-mono text-lg font-medium text-emerald-600 dark:text-emerald-400">
                        {formatPrice(totals.income, 2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                        Egresos
                      </div>
                      <div className="font-mono text-lg font-medium text-red-600 dark:text-red-400">
                        {formatPrice(totals.expense, 2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                        Neto
                      </div>
                      <div className="font-mono text-lg font-medium">
                        {formatPrice(totals.net, 2)}
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
                        Emisor
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium w-[140px]">
                        Fecha
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium w-[100px]">
                        Tipo
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium text-right w-[140px]">
                        Total
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-widest font-medium w-[120px]">
                        Estado
                      </TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
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
                              {invoice.businessPartner?.rfc}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          <time
                            dateTime={new Date(
                              invoice.invoiceDate
                            ).toISOString()}
                          >
                            {new Date(invoice.invoiceDate).toLocaleDateString(
                              "es-MX",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </time>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              invoice.cfdiType === "I"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                            }
                          >
                            {getCFDIType(invoice.cfdiType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-mono text-sm font-medium">
                            {formatPrice(Number(invoice.total), 2)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {invoice.currency}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {invoice.status}
                          </Badge>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
    </div>
  );
}
