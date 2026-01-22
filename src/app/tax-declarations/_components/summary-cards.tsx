"use client";

import {
  DollarSign,
  FileText,
  HandCoins,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { SummaryCard } from "@/components/summary-card";
import { TaxDeclaration } from "@/types/tax-declarations";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: TaxDeclaration;
  currentPeriod: {
    netAmount: number;
    totalIncome: number;
    totalExpenses: number;
    incomeInvoiceCount: number;
    expenseInvoiceCount: number;
  };
}

export function SummaryCards({ data, currentPeriod }: Props) {
  // If a declaration exists, use its values. Otherwise, use values from the period summary.
  const totalIncome = data
    ? parseFloat(data.totalIncome)
    : currentPeriod.totalIncome;
  const totalExpenses = data
    ? parseFloat(data.totalExpenses)
    : currentPeriod.totalExpenses;
  // netAmount is the taxable base (isrBase) from the declaration.
  const netAmount = data ? parseFloat(data.isrBase!) : currentPeriod.netAmount;

  const estimatedTax = data ? parseFloat(data.isrCalculated!) : 0;
  const taxRate = data ? parseFloat(data.isrRate || "0") : 0;

  // IVA values
  const displayIvaBalance = data ? parseFloat(data.ivaBalance || "0") : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Income Card */}
      <SummaryCard
        title="Ingresos"
        value={formatCurrency(totalIncome)}
        subtitle={`${currentPeriod.incomeInvoiceCount} facturas`}
        icon={TrendingUp}
        color="green"
      />

      {/* Expenses Card */}
      <SummaryCard
        title="Egresos"
        value={formatCurrency(totalExpenses)}
        subtitle={`${currentPeriod.expenseInvoiceCount} facturas`}
        icon={TrendingDown}
        color="red"
      />

      {/* Net Amount Card */}
      <SummaryCard
        title="Base Gravable"
        value={formatCurrency(netAmount)}
        subtitle="Ingresos - Deducibles"
        icon={DollarSign}
        color="neutral"
      />

      {/* Estimated Tax Card */}
      <SummaryCard
        title="ISR"
        value={formatCurrency(estimatedTax)}
        subtitle={`Tasa del ${(taxRate * 100).toFixed(2)}%`}
        icon={FileText}
        color="blue"
      />

      {/* IVA Balance Card */}
      <SummaryCard
        title="IVA"
        value={formatCurrency(displayIvaBalance)}
        subtitle="Cobrado - Acreditable"
        icon={HandCoins}
        color="amber"
      />
    </div>
  );
}
