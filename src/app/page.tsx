import { OrganizationCard } from "@/components/organizations/organization-card";
import { getOrganizations } from "@/data/organizations";
import { getTaxRegimes } from "@/data/taxRegimes";
import { BusinessPartnersCard } from "@/components/business-partners/business-partners-card";
import { CFDIUploader } from "@/components/cfdi-uploader";
import { InvoicesList } from "@/components/invoices/invoices-list";
import { Calendar } from "lucide-react";

const getData = async () => {
  const [regimes, organizations] = await Promise.all([
    getTaxRegimes(),
    getOrganizations(),
  ]);

  return {
    regimes,
    organizations,
  };
};

export default async function Home() {
  const { regimes, organizations } = await getData();
  const organization = organizations?.[0] ?? undefined;

  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-linear-to-br from-muted/30 via-background to-background">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                {monthName}
              </span>
            </div>

            <h1 className="text-6xl font-light tracking-tight leading-[1.1]">
              Panel de Control
              <span className="block text-muted-foreground mt-2">
                FDI Assistant
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Gestión inteligente de comprobantes fiscales digitales. Monitorea
              tus facturas, analiza tendencias y mantén el control total de tu
              operación fiscal.
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <OrganizationCard regimes={regimes} organization={organization} />
          <div className="lg:col-span-2">
            <BusinessPartnersCard regimes={regimes} />
          </div>
          <div className="lg:col-span-3">
            <CFDIUploader organization={organization} />
          </div>
        </div>
        <InvoicesList />
      </div>
    </div>
  );
}
