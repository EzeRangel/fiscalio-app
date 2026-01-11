"use client";

import { BusinessPartner } from "@/types/businessPartners";
import { FileText, TrendingDown, TrendingUp, UsersIcon } from "lucide-react";

interface Props {
  partners: BusinessPartner[];
}

export function StatsCards({ partners }: Props) {
  const stats = {
    total: partners.length,
    clients: partners.filter(
      (p) => p.partnerType === "client" || p.partnerType === "both"
    ).length,
    suppliers: partners.filter(
      (p) => p.partnerType === "supplier" || p.partnerType === "both"
    ).length,
    totalVolume: 25000,
    // totalVolume: partners.reduce((sum, p) => sum + p.totalVolume, 0),
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
              <div className="text-xs text-muted-foreground uppercase tracking-widest">
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
                {stats.clients}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">
                Clientes
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
                {stats.suppliers}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">
                Proveedores
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2.5">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-mono font-medium">
                ${(stats.totalVolume / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">
                Volumen Total
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
