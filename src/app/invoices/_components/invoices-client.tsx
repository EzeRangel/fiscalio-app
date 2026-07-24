"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import Filters from "./filters";
import List from "./list";
import { isInvoiceLinked } from "@/lib/invoice-utils";
import { InvoiceDetails } from "@/types/invoices";
import { cn } from "@/lib/utils";

interface InvoicesClientProps {
  invoices: InvoiceDetails[];
}

export default function InvoicesClient({ invoices }: InvoicesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [periodGroup, setPeriodGroup] = useState<"month" | "year" | "none">(
    "month",
  );
  const [isPending, startTransition] = useTransition();
  const [displayInvoices, setDisplayInvoices] = useState(invoices);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Filter out linked invoices (like individual payments in a complement)
      if (isInvoiceLinked(invoice)) return false;

      const matchesSearch =
        !searchQuery ||
        invoice.businessPartner?.rfc
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        invoice.businessPartner?.legalName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        invoice.internalFolio
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "all" || invoice.invoiceType === filterType;

      return matchesSearch && matchesType;
    });
  }, [invoices, searchQuery, filterType]);

  // Use useEffect to update displayInvoices with a transition
  useEffect(() => {
    startTransition(() => {
      setDisplayInvoices(filteredInvoices);
    });
  }, [filteredInvoices]);

  return (
    <section className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-muted/20 animate-fade-in">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-light tracking-tight">Facturas</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground font-mono text-sm">
                  {displayInvoices.length}{" "}
                  {displayInvoices.length === 1 ? "documento" : "documentos"}
                </p>
                {isPending && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <Filters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cfdiTypeFilter={filterType}
        onCfdiTypeChange={setFilterType}
        periodGroup={periodGroup}
        onPeriodGroupChange={setPeriodGroup}
      />

      <section
        className={cn(
          "container mx-auto px-6 py-8 transition-opacity duration-300",
          isPending ? "opacity-50" : "opacity-100",
        )}
      >
        <List invoices={displayInvoices} allInvoices={invoices} periodGroup={periodGroup} />
      </section>
    </section>
  );
}
