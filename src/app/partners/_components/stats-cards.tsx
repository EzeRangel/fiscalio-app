"use client";

import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp, UsersIcon, Wallet } from "lucide-react";
import { PrivacyBlur } from "@/components/privacy-blur";
import { BusinessPartnerWithStats } from "@/types/businessPartners";
import { SummaryCard } from "@/components/summary-card";

interface Props {
  partners: BusinessPartnerWithStats[];
  globalStats?: {
    totalClientVolume: number;
    totalProviderVolume: number;
    totalClientPaidVolume: number;
    totalProviderPaidVolume: number;
  };
}

export function StatsCards({ partners, globalStats }: Props) {
  const stats = {
    total: partners.length,
    clients: partners.filter(
      (p) => p.partnerType === "client" || p.partnerType === "both",
    ).length,
    suppliers: partners.filter(
      (p) => p.partnerType === "supplier" || p.partnerType === "both",
    ).length,
    clientVolume: globalStats?.totalClientVolume ?? 0,
    providerVolume: globalStats?.totalProviderVolume ?? 0,
    clientPaid: globalStats?.totalClientPaidVolume ?? 0,
    providerPaid: globalStats?.totalProviderPaidVolume ?? 0,
  };

  return (
    <div className="container mx-auto px-6 -mt-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Cobrado (Clientes)"
          subtitle={`de ${formatCurrency(stats.clientVolume)} facturado`}
          value={formatCurrency(stats.clientPaid)}
          color="green"
          icon={TrendingUp}
        />

        <SummaryCard
          title="Pagado (Proveedores)"
          subtitle={`de ${formatCurrency(stats.providerVolume)} facturado`}
          value={formatCurrency(stats.providerPaid)}
          color="red"
          icon={TrendingDown}
        />

        <SummaryCard
          title="Flujo Neto"
          subtitle="Balance de efectivo real"
          value={formatCurrency(stats.clientPaid - stats.providerPaid)}
          color="blue"
          icon={Wallet}
        />

        <SummaryCard
          title="Socios Totales"
          value={stats.total.toString()}
          color="neutral"
          icon={UsersIcon}
        />
      </div>
    </div>
  );
}
