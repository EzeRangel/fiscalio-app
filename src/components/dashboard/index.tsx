"use client";

import {
  getDashboardMetricsAction,
  getInvoicesByPeriodAction,
} from "@/actions/dashboard";
import { useQuery } from "@tanstack/react-query";
import SummaryCards from "./summary-cards";
import { InvoicesList } from "../invoices/invoices-list";
import Uploader from "./uploader";
import { useState, useMemo } from "react";
import { PeriodSelection } from "@/types/dashboard";
import { PeriodSelector } from "./period-selector";

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodSelection>(() => {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear(),
    };
  });

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["dashboard-invoices", period],
    queryFn: async () => {
      const result = await getInvoicesByPeriodAction(period);
      if (result?.data) return result.data;
      throw new Error("Failed to fetch invoices");
    },
  });

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["dashboard-metrics", period],
    queryFn: async () => {
      const result = await getDashboardMetricsAction(period);
      if (result?.data) return result.data;
      throw new Error("Failed to fetch metrics");
    },
  });

  const monthName = useMemo(() => {
    const date = new Date(period.year, period.month, 1);
    return date.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
  }, [period]);

  return (
    <section className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light tracking-tight">
          Resumen de {monthName}
        </h2>
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      <SummaryCards
        monthName={monthName}
        invoices={invoices}
        metrics={metrics}
        isLoading={isLoadingMetrics}
      />

      <Uploader />
      <InvoicesList invoices={invoices} />
    </section>
  );
}
