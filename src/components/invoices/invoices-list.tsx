"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getLatestInvoicesAction } from "@/actions/get-latest-invoices";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/hooks/usePrice";
import { getCFDIType } from "@/lib/utils";
import { Button } from "../ui/button";

export function InvoicesList() {
  const {
    data: invoices,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["latest-invoices"],
    queryFn: () => getLatestInvoicesAction(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !invoices) {
    return (
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-light tracking-tight">
              Facturas Recientes
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              No hay facturas. Inicia subiendo tus primeros CFDIs
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-light tracking-tight">
            Facturas Recientes
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            Documentos fiscales del mes en curso — {invoices.length} registros
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
        {invoices.map((invoice) => (
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
                      {invoice.businessPartner?.rfc}
                    </div>
                  </div>
                </div>

                {/* Right: Type & Amount */}
                <div className="flex items-center gap-6 shrink-0">
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

                  <div className="text-right">
                    <div className="text-lg font-mono font-medium">
                      {formatPrice(Number(invoice.total), 2)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {invoice.currency}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {/* View All CTA */}
      <div className="pt-4 border-t border-border">
        <Button asChild variant="ghost" className="w-full gap-2 text-sm">
          <Link href="/invoices">
            Explorar todas las facturas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
