"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Filters from "./filters";
import List from "./list";
import { InferResultType } from "@/types/orm";
import { isInvoiceLinked } from "@/lib/invoice-utils";

type InvoiceWithContacts = InferResultType<
  "invoices",
  {
    businessPartner: true;
    allocations: true;
    linkedPayments: { allocations: true };
  }
>;

interface InvoicesClientProps {
  invoices: InvoiceWithContacts[];
}

export default function InvoicesClient({ invoices }: InvoicesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [periodGroup, setPeriodGroup] = useState<"month" | "year" | "none">(
    "month",
  );

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
        invoice.internalFolio?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "all" || invoice.invoiceType === filterType;

      return matchesSearch && matchesType;
    });
  }, [invoices, searchQuery, filterType]);

  return (
    <section className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-light tracking-tight">Facturas</h1>
              <p className="text-muted-foreground font-mono text-sm">
                {filteredInvoices.length}{" "}
                {filteredInvoices.length === 1 ? "documento" : "documentos"}
              </p>
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

      <section className="container mx-auto px-6 py-8">
        <List invoices={filteredInvoices} periodGroup={periodGroup} />
      </section>
    </section>
  );
}
