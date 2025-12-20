"use client";

import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CreditCard,
  Download,
  FileText,
  Receipt,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDetails as CFDI } from "@/types/invoices";

interface Props {
  data: CFDI;
}

export function InvoiceDetails({ data: invoice }: Props) {
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant="outline"
                className="font-mono text-xs tracking-wider"
              >
                {invoice.cfdiType}
              </Badge>
              <Badge className="font-mono text-xs tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                {invoice.status}
              </Badge>
            </div>

            <h1 className="text-5xl font-light tracking-tight leading-tight text-balance">
              Factura Digital
            </h1>

            <p className="text-2xl font-mono text-muted-foreground tracking-tight">
              {invoice.internalFolio}
            </p>
          </div>

          {/* Folio Fiscal - Feature */}
          <div className="p-6 bg-muted/30 border-l-4 border-primary">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
              Folio Fiscal UUID
            </div>
            <div className="font-mono text-sm break-all text-foreground leading-relaxed">
              {invoice.folioFiscal}
            </div>
          </div>

          {/* Business Partner */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest font-medium">
                Receptor
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-light mb-1">
                {invoice.businessPartner?.legalName}
              </h2>
              <div className="flex gap-6 text-sm text-muted-foreground font-mono">
                <span>RFC: {invoice.businessPartner?.rfc}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {invoice.businessPartner?.taxRegimeId}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-8 space-y-6">
            {/* Total Amount - Hero Number */}
            <div className="p-8 bg-primary text-primary-foreground rounded-lg">
              <div className="text-xs uppercase tracking-widest mb-3 opacity-80 font-medium">
                Total
              </div>
              <div className="text-5xl font-mono font-light tracking-tight mb-2">
                ${invoice.total}
              </div>
              <div className="text-sm opacity-80 font-mono">
                {invoice.currency}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-4 p-6 border border-border rounded-lg">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-mono text-lg">${invoice.subtotal}</span>
              </div>

              {invoice.totalTaxes && invoice.totalTaxes !== "0.00" && (
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">
                    Impuestos
                  </span>
                  <span className="font-mono text-lg text-emerald-600 dark:text-emerald-400">
                    +${invoice.totalTaxes}
                  </span>
                </div>
              )}

              {invoice.discount && invoice.discount !== "0" && (
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">
                    Descuento
                  </span>
                  <span className="font-mono text-lg text-red-600 dark:text-red-400">
                    -${invoice.discount}
                  </span>
                </div>
              )}

              {/* <Separator /> */}

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-sm font-medium">Total</span>
                <span className="font-mono text-2xl font-medium">
                  ${invoice.total}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full gap-2" size="lg">
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 bg-transparent"
                size="lg"
              >
                <FileText className="h-4 w-4" />
                Descargar XML
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="mb-16">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6 font-medium">
          Información Fiscal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-widest">Emisión</span>
            </div>
            <p className="font-mono text-sm">
              {new Date(invoice.invoiceDate).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {new Date(invoice.invoiceDate).toLocaleTimeString("es-MX")}
            </p>
          </div>

          {invoice.certificationDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Receipt className="h-3.5 w-3.5" />
                <span className="text-xs uppercase tracking-widest">
                  Timbrado
                </span>
              </div>
              <p className="font-mono text-sm">
                {new Date(invoice.certificationDate).toLocaleDateString(
                  "es-MX",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {new Date(invoice.certificationDate).toLocaleTimeString(
                  "es-MX"
                )}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-widest">
                Método de Pago
              </span>
            </div>
            <p className="text-sm leading-relaxed">{invoice.paymentMethod}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-widest">
                Forma de Pago
              </span>
            </div>
            <p className="text-sm leading-relaxed">{invoice.paymentForm}</p>
          </div>
        </div>
      </div>

      {/* Line Items - Editorial Table */}
      <div className="space-y-8">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            Conceptos Facturados
          </h3>
          <p className="text-2xl font-light">
            {invoice.items.length}{" "}
            {invoice.items.length === 1 ? "concepto" : "conceptos"}
          </p>
        </div>

        <div className="space-y-6">
          {invoice.items.map((item, index) => (
            <div
              key={item.id}
              className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              {/* Item Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h4 className="text-lg font-light leading-relaxed text-balance">
                    {item.description}
                  </h4>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-2xl font-mono font-light">
                    ${item.subtotal}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.currency}
                  </div>
                </div>
              </div>

              {/* Item Details Grid */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border/50">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Cantidad
                  </div>
                  <div className="font-mono text-sm">{item.quantity}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Unidad
                  </div>
                  <div className="text-sm">{item.unit}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Precio Unit.
                  </div>
                  <div className="font-mono text-sm">${item.unitPrice}</div>
                </div>
              </div>

              {/* Taxes */}
              {item.taxes && item.taxes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Impuestos Aplicados
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {item.taxes.map((tax) => (
                      <div key={tax.id} className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">
                          {tax.taxName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tax.taxType} • {tax.rate}
                        </span>
                        <span className="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          ${tax.taxAmount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-16 pt-8 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Documento fiscal digital emitido conforme a las disposiciones fiscales
          vigentes del SAT
        </p>
      </div>
    </div>
  );
}
