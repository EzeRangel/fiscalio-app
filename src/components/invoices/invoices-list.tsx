"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText } from "lucide-react";
import { formatPrice } from "@/hooks/usePrice";
import { getCFDIType } from "@/lib/utils";
import { Button } from "../ui/button";
import { PrivacyBlur } from "../privacy-blur";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { InferResultType } from "@/types/orm";

type InvoiceWithBusinessPartner = InferResultType<
  "invoices",
  { businessPartner: true; allocations: true }
>;

interface Props {
  invoices?: InvoiceWithBusinessPartner[];
}

const getPaymentStatus = (total: number, paid: number) => {
    if (paid <= 0) return { label: "Pendiente", color: "bg-red-500/10 text-red-700 border-red-500/20" };
    if (paid >= total) return { label: "Pagado", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" };
    return { label: "Parcial", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" };
};

const calculateInvoicePaid = (invoice: InvoiceWithBusinessPartner) => {
    return (invoice.allocations || []).reduce((sum, alloc) => sum + Number(alloc.amountAllocated), 0);
};

export function InvoicesList({ invoices }: Props) {
  const hasInvoices = !!invoices && invoices.length >= 1;

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-light tracking-tight">
            Facturas Recientes
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            Documentos fiscales del mes en curso — {invoices?.length || 0}{" "}
            registros
          </p>
        </div>

        <Button asChild variant="outline" className="gap-2 bg-transparent">
          <Link href="/invoices">
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      {/* Invoice List */}
      <div className="space-y-3">
        {!hasInvoices ? (
          <Empty className="border border-dashed">
            <EmptyContent>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>No hay facturas este mes</EmptyTitle>
                <EmptyDescription>
                  Comienza a emitir documentos fiscales para ver tu actividad
                  aquí. Los comprobantes emitidos aparecerán en esta sección
                  automáticamente.
                </EmptyDescription>
              </EmptyHeader>
              <Button asChild variant="default" className="gap-2">
                <Link href="/invoices">
                  Explorar histórico
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {invoices?.map((invoice) => {
              const totalPaid = calculateInvoicePaid(invoice);
              const status = getPaymentStatus(Number(invoice.total), totalPaid);

              return (
                <Card
                  key={invoice.id}
                  className="group hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <Link href={`/invoices/${invoice.id}`}>
                    <div className="p-5 flex items-center justify-between gap-6">
                      {/* Left: Invoice Info */}
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="shrink-0">
                          <div className="text-sm font-mono font-medium">
                            {invoice.internalFolio}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {new Date(invoice.invoiceDate).toLocaleDateString(
                              "es-MX",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </div>
                        </div>

                        <div className="h-10 w-px bg-border shrink-0" />

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-sm font-medium truncate">
                            {invoice.businessPartner?.legalName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            <PrivacyBlur>{invoice.businessPartner?.rfc}</PrivacyBlur>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status & Amount */}
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="flex flex-col items-end gap-1.5">
                            <Badge
                                variant="outline"
                                className={
                                invoice.cfdiType === "I"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                }
                            >
                                {/* @ts-expect-error Incorrect type */}
                                {getCFDIType(invoice.cfdiType)}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={`font-mono text-[10px] uppercase tracking-tighter ${status.color}`}
                            >
                                {status.label}
                            </Badge>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-mono font-medium">
                            <PrivacyBlur>
                              {formatPrice(totalPaid, 2)}
                            </PrivacyBlur>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            de {formatPrice(Number(invoice.total), 2)} {invoice.currency}
                          </div>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </Card>
              );
            })}
            {/* View All CTA */}
            <div className="pt-4 border-t border-border">
              <Button asChild variant="ghost" className="w-full gap-2 text-sm">
                <Link href="/invoices">
                  Explorar todas las facturas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
