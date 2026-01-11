import { Users } from "lucide-react";
import { StatsCards } from "./_components/stats-cards";
import { Table } from "./_components/table";
import { getTaxRegimes } from "@/data/taxRegimes";
import { getActiveOrganizationId } from "@/lib/session";
import { fetchBusinessPartnersByOrg } from "@/data/businessPartners";
import { BusinessPartnersDialogForm } from "@/components/business-partners/business-partners-dialog-form";
import {
  fetchBusinessPartnersWithAnalytics,
  fetchGlobalPartnerStats,
} from "@/data/businessPartners";

const getData = async () => {
  const activeOrg = await getActiveOrganizationId();

  const [regimes, partnersWithAnalytics, globalStats] = await Promise.all([
    getTaxRegimes(),
    fetchBusinessPartnersWithAnalytics(activeOrg),
    fetchGlobalPartnerStats(activeOrg),
  ]);

  return {
    regimes,
    partners: partnersWithAnalytics,
    globalStats,
  };
};

export default async function PartnersPage() {
  const { regimes, partners, globalStats } = await getData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-br from-muted/30 via-background to-background">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest text-primary">
                  Gestión de Socios
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl font-light tracking-tight leading-[1.1]">
                  Socios de Negocio
                  <span className="block text-muted-foreground text-2xl mt-2">
                    Clientes y Proveedores
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Administra tu catálogo de socios comerciales. Registra
                  manualmente o detecta automáticamente a través del
                  procesamiento de facturas.
                </p>
              </div>
            </div>
            <BusinessPartnersDialogForm regimes={regimes} />
          </div>
        </div>
      </header>

      <StatsCards partners={partners} globalStats={globalStats} />

      <Table data={partners} />
    </div>
  );
}
