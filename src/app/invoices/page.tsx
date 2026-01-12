import { Button } from "@/components/ui/button";
import { getInvoicesByOrganization } from "@/data/invoices";
import { Download } from "lucide-react";
import Filters from "./_components/filters";
import List from "./_components/list";
import { getActiveOrganizationId } from "@/lib/session";

const getData = async (partnerId?: number) => {
  const organizationId = await getActiveOrganizationId();
  const [invoices] = await Promise.all([
    getInvoicesByOrganization(organizationId, { partnerId }),
  ]);

  return {
    invoices,
  };
};

export default async function InvoicesList({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner } = await searchParams;
  const partnerId = partner ? parseInt(partner) : undefined;
  const { invoices } = await getData(partnerId);

  return (
    <section className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-light tracking-tight">Facturas</h1>
              <p className="text-muted-foreground font-mono text-sm">
                {invoices.length}{" "}
                {invoices.length === 1 ? "documento" : "documentos"}
              </p>
            </div>

            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </header>
      <Filters />
      <section className="container mx-auto px-6 py-8">
        <List invoices={invoices} />
      </section>
    </section>
  );
}
