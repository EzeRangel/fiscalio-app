import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DeclarationInvoice } from "@/types/declaration-invoices";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getIvaTypeLabel } from "../_utils/getIvaTypeLabel";
import { AlertCircle } from "lucide-react";
import { PrivacyBlur } from "@/components/privacy-blur";

interface Props {
  data: DeclarationInvoice;
}

export function InvoiceItem({ data: item }: Props) {
  const ivaTypeInfo = getIvaTypeLabel(item.ivaType);

  return (
    <a
      key={item.id}
      href={`/invoices/${item.invoice.id}`}
      className="block border border-border rounded-lg p-4 bg-card/30 hover:bg-card/70 hover:border-primary/30 transition-all duration-200 group"
    >
      {/* Invoice Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
              {item.invoice.folioFiscal}
            </span>
            {item.wasManuallyAdjusted && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-chart-2/10 border border-chart-2/20 text-chart-2">
                Ajustado
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {item.invoice.businessPartner?.businessName}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {format(new Date(item.invoice.invoiceDate), "dd MMM yyyy", {
              locale: es,
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-semibold text-foreground">
            <PrivacyBlur>{formatCurrency(item.invoice.total)}</PrivacyBlur>
          </p>
        </div>
      </div>

      {/* Classification */}
      <div className="bg-muted/30 rounded-lg p-3 mb-3 border border-border/50">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground font-mono">
            Cuenta Contable
          </span>
          <span className="font-mono font-medium">
            {item.appliedAccountCode}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.appliedAccountName}
        </p>
      </div>

      {/* Financial Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Deduction Status */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              Deducible
            </span>
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded border",
                item.isDeductible
                  ? "text-chart-4 bg-chart-4/10 border-chart-4/20"
                  : "text-muted-foreground bg-muted/50 border-muted"
              )}
            >
              {item.isDeductible ? "Sí" : "No"}
            </span>
          </div>
          {item.isDeductible && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                Porcentaje
              </span>
              <span className="text-xs font-mono font-medium">
                {Number.parseFloat(item.deductionPercentage!).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* IVA Type */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              Tipo IVA
            </span>
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded border capitalize",
                ivaTypeInfo.className
              )}
            >
              {ivaTypeInfo.text}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              Monto IVA
            </span>
            <span className="text-xs font-mono font-medium">
              <PrivacyBlur>{formatCurrency(item.ivaAmount!)}</PrivacyBlur>
            </span>
          </div>
        </div>
      </div>

      {/* Amounts Summary */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">
            Incluido
          </p>
          <p className="text-sm font-mono font-medium">
            <PrivacyBlur>{formatCurrency(item.includedAmount)}</PrivacyBlur>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">
            Deducible
          </p>
          <p className="text-sm font-mono font-medium text-chart-4">
            <PrivacyBlur>{formatCurrency(item.deductibleAmount!)}</PrivacyBlur>
          </p>
        </div>
      </div>

      {/* Manual Adjustment Warning */}
      {item.wasManuallyAdjusted && item.adjustmentReason && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3 w-3 text-chart-2 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              {item.adjustmentReason}
            </p>
          </div>
        </div>
      )}
    </a>
  );
}
