"use client";

import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { BusinessPartner } from "@/types/businessPartners";
import { TrendingDown, TrendingUp, UsersIcon, Wallet } from "lucide-react";

interface Props {
  partners: BusinessPartner[];
  globalStats?: {
    totalClientVolume: number;
    totalProviderVolume: number;
  };
}

export function StatsCards({ partners, globalStats }: Props) {
  const stats = {
    total: partners.length,
    clients: partners.filter(
      (p) => p.partnerType === "client" || p.partnerType === "both"
    ).length,
    suppliers: partners.filter(
      (p) => p.partnerType === "supplier" || p.partnerType === "both"
    ).length,
    clientVolume: globalStats?.totalClientVolume ?? 0,
    providerVolume: globalStats?.totalProviderVolume ?? 0,
  };

  return (
    <div className="container mx-auto px-6 -mt-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2.5">
              <UsersIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-mono font-medium">
                {stats.total}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                Socios Totales
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-mono font-medium">
                {formatCurrency(stats.clientVolume)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                Volumen Clientes
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-2.5">
              <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-mono font-medium">
                {formatCurrency(stats.providerVolume)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                Volumen Proveedores
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2.5">
              <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-mono font-medium">
                {formatCurrency(stats.clientVolume - stats.providerVolume)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                Balance Neto
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
