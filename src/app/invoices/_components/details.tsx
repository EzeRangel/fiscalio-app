"use client";

import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CreditCard,
  Download,
  FileText,
  Receipt,
  User,
  ArrowRightLeft,
  AlertCircle,
  Pencil,
  X,
  Undo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDetails as CFDI } from "@/types/invoices";
import { Separator } from "@/components/ui/separator";
import { ClassificationFeedback } from "./classification-feedback";
import ClassificationAssigned from "./classification-assigned";
import {
  cn,
  formatCurrency,
  getPaymentMethod,
  getTaxType,
  getInvoiceType,
  getPaymentForm,
} from "@/lib/utils";
import { PaymentAllocation } from "@/types/payments";
import { formatPrice } from "@/hooks/usePrice";
import { PrivacyBlur } from "@/components/privacy-blur";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { EditPaymentDialog } from "./edit-payment-dialog";
import { CancelInvoiceDialog } from "./cancel-invoice-dialog";
import { RegisterRefundDialog } from "./register-refund-dialog";
import { LinkPaymentComplementDialog } from "./link-payment-complement-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { INVOICE_TYPE, INVOICE_TYPE_COLOR } from "@/lib/constants";
import { PaymentForms, PaymentMethods, TaxTypes } from "@/types/utils";

import { FiscalValidationError } from "@/lib/fiscal-validation";
import { ValidationMessages } from "./validations";
import { calculateCreditableIva } from "@/lib/invoice-utils";

interface Props {
  data: CFDI;
  relatedPayments?: PaymentAllocation[];
}

const getPaymentStatus = (status: string) => {
  switch (status) {
    case "paid":
      return {
        label: "Pagado",
        color: "text-emerald-700 border-emerald-500/20 bg-emerald-500/10",
      };
    case "partial":
      return {
        label: "Parcial",
        color: "text-amber-700 border-amber-500/20 bg-amber-500/10",
      };
    case "refunded":
      return {
        label: "Reembolsado",
        color:
          "text-blue-700 border-blue-500/20 bg-blue-500/10 dark:text-blue-400",
      };
    case "pending":
    default:
      return {
        label: "Pendiente",
        color: "text-red-700 border-red-500/20 bg-red-500/10",
      };
  }
};

export const calculateInvoicePaid = (invoice: CFDI) => {
  return (invoice.allocations || []).reduce(
    (sum, alloc) => sum + Number(alloc.amountAllocated),
    0,
  );
};

export function InvoiceDetails({ data: invoice, relatedPayments = [] }: Props) {
  const isPaymentComplement = invoice.cfdiType === "P";
  const [editingPayment, setEditingPayment] =
    useState<PaymentAllocation | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const totalPaid = calculateInvoicePaid(invoice);
  const paymentStatus = getPaymentStatus(invoice.paymentStatus || "pending");
  const validationErrors = invoice.validationErrors || [];

  const totalIva = invoice.items.reduce((sum, item) => {
    return (
      sum +
      item.taxes.reduce((itemSum, tax) => {
        if (tax.taxCode === "002" && tax.taxType === "transferred") {
          return itemSum + parseFloat(tax.taxAmount);
        }
        return itemSum;
      }, 0)
    );
  }, 0);

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Fiscal Validation Errors */}
      {validationErrors && validationErrors.length > 0 && (
        <ValidationMessages
          validations={validationErrors as FiscalValidationError[]}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs tracking-wider",
                  // @ts-expect-error Incorrect type
                  INVOICE_TYPE_COLOR[invoice.invoiceType] || "bg-gray-500/10",
                )}
              >
                {getInvoiceType(
                  invoice.invoiceType as keyof typeof INVOICE_TYPE,
                )}
              </Badge>

              <Badge
                variant="outline"
                className={cn(
                  "font-mono tracking-tighter",
                  paymentStatus.color,
                )}
              >
                {paymentStatus.label}
              </Badge>

              {invoice.status !== "active" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs tracking-wider",
                    invoice.status === "cancelled"
                      ? "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
                  )}
                >
                  {invoice.status === "cancelled" ? "Cancelada" : "Sustituida"}
                </Badge>
              )}
            </div>

            <h1 className="text-5xl font-light tracking-tight leading-tight text-balance">
              {isPaymentComplement ? "Complemento de Pago" : "Factura Digital"}
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
                {invoice.invoiceType === "income" ? "Receptor" : "Emisor"}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-light mb-1">
                {invoice.businessPartner?.legalName}
              </h2>
              <div className="flex gap-6 text-sm text-muted-foreground font-mono">
                <span>
                  RFC: <PrivacyBlur>{invoice.businessPartner?.rfc}</PrivacyBlur>
                </span>
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
                {isPaymentComplement ? "Monto Total Pagado" : "Total"}
              </div>
              <div className="text-5xl font-mono font-light tracking-tight mb-2">
                <PrivacyBlur>${invoice.total}</PrivacyBlur>
              </div>
              <div className="text-sm opacity-80 font-mono">
                {invoice.currency}
              </div>
            </div>

            {/* Financial Breakdown */}
            {!isPaymentComplement && (
              <div className="space-y-4 p-6 border border-border rounded-lg">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="font-mono text-lg">
                    <PrivacyBlur>${invoice.subtotal}</PrivacyBlur>
                  </span>
                </div>

                {invoice.totalTaxes && invoice.totalTaxes !== "0.00" && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">
                      Impuestos
                    </span>
                    <span className="font-mono text-lg text-emerald-600 dark:text-emerald-400">
                      +<PrivacyBlur>${invoice.totalTaxes}</PrivacyBlur>
                    </span>
                  </div>
                )}

                {invoice.discount && invoice.discount !== "0" && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">
                      Descuento
                    </span>
                    <span className="font-mono text-lg text-red-600 dark:text-red-400">
                      -<PrivacyBlur>${invoice.discount}</PrivacyBlur>
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-mono text-2xl font-medium">
                    <PrivacyBlur>${invoice.total}</PrivacyBlur>
                  </span>
                </div>
              </div>
            )}

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

              {invoice.cfdiType === "I" && invoice.status === "active" && (
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  size="lg"
                  onClick={() => setLinkDialogOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Vincular Pago
                </Button>
              )}

              {(invoice.cfdiType === "I" || invoice.cfdiType === "E") &&
                invoice.status === "active" && (
                  <div className="pt-3 border-t border-border/50 space-y-3">
                    {Number(invoice.amountPaid) > 0 && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs space-y-2">
                        <p className="font-semibold">
                          Esta factura tiene pagos activos.
                        </p>
                        <p>
                          Para poder cancelarla con motivo 03, primero debe
                          registrar una devolución (refund).
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-8 border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 bg-transparent"
                          onClick={() => setRefundDialogOpen(true)}
                        >
                          Registrar Devolución
                        </Button>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full gap-2"
                      size="lg"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <X className="h-4 w-4" />
                      Cancelar Factura
                    </Button>
                  </div>
                )}
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
                  },
                )}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {new Date(invoice.certificationDate).toLocaleTimeString(
                  "es-MX",
                )}
              </p>
            </div>
          )}

          {!isPaymentComplement && (
            <>
              {invoice.paymentMethod ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="text-xs uppercase tracking-widest">
                      Método de Pago
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {getPaymentMethod(invoice.paymentMethod as PaymentMethods)}
                  </p>
                </div>
              ) : null}

              {invoice.paymentForm ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="text-xs uppercase tracking-widest">
                      Forma de Pago
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {getPaymentForm(invoice.paymentForm as PaymentForms)}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {!isPaymentComplement ? (
        <div className="mb-16">
          {invoice.accountId ? (
            <ClassificationAssigned
              account={invoice.account!}
              totalIva={totalIva}
              invoiceType={invoice.invoiceType}
            />
          ) : (
            <ClassificationFeedback invoice={invoice} />
          )}
        </div>
      ) : null}

      {/* Pagos Relacionados (For Payment Complements OR Standard PUE Invoices) */}
      {relatedPayments.length > 0 && (
        <div className="space-y-8 mb-8">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
              {isPaymentComplement ? "Pagos Realizados" : "Historial de Pagos"}
            </h3>
            <p className="text-2xl font-light">
              {relatedPayments.length}{" "}
              {relatedPayments.length === 1 ? "pago" : "pagos"} registrados
            </p>
          </div>

          <div className="space-y-6">
            {relatedPayments.map((payment) => {
              // Heuristic to detect if it's the auto-generated PUE payment
              const isAutoGenerated =
                payment.notes?.includes("Autogenerado") ||
                (invoice.paymentMethod === "PUE" &&
                  payment.allocations?.[0]?.invoiceId === invoice.id &&
                  Math.abs(Number(payment.amount) - Number(invoice.total)) <
                    0.01);

              return (
                <div
                  key={payment.id}
                  className="group border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row gap-6 justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {payment.isRefund ||
                        payment.paymentType === "refund" ? (
                          <>
                            <Undo className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400">
                              Devolución
                            </span>
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs uppercase tracking-widest">
                              Fecha de Pago
                            </span>
                          </>
                        )}
                        {isAutoGenerated && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant="secondary"
                                  className="h-5 px-1.5 gap-1 text-[10px] text-amber-600 bg-amber-500/10 border-amber-200 hover:bg-amber-500/20"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Verificar
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Pago generado automáticamente (PUE). Por favor
                                  verifique la fecha real.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="font-mono text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "es-MX",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-2xl font-mono font-light">
                          <PrivacyBlur>${payment.amount}</PrivacyBlur>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditingPayment(payment)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payment.currency} • TC: {payment.exchangeRate}
                      </div>
                    </div>
                  </div>

                  {/* Allocations (Invoices paid by this payment) */}
                  {payment.allocations && payment.allocations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <ArrowRightLeft className="h-3 w-3" />
                        Facturas Saldadas
                      </div>
                      <div className="grid gap-3">
                        {payment.allocations.map((allocation) => (
                          <div
                            key={allocation.id}
                            className="flex justify-between items-center text-sm bg-muted/20 p-2 rounded"
                          >
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-muted-foreground">
                                {allocation.invoice?.folioFiscal}
                              </span>
                              <span className="font-medium">
                                Parcialidad {allocation.installmentNumber}
                              </span>
                            </div>
                            <div className="font-mono font-medium">
                              <PrivacyBlur>
                                {formatPrice(
                                  Number(allocation.amountAllocated),
                                  2,
                                )}
                              </PrivacyBlur>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Line Items - Editorial Table (Standard Only) */}
      {!isPaymentComplement && (
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
            {invoice.items.map((item, index) => {
              const subtotal =
                parseFloat(item.subtotal) - parseFloat(item.discount || " 0");

              const taxes = item.taxes.reduce((acc, item) => {
                if (item.taxType === "transferred") {
                  return acc + parseFloat(item.taxAmount);
                }

                return acc;
              }, 0);

              return (
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
                        <PrivacyBlur>
                          {formatCurrency(subtotal + taxes)}
                        </PrivacyBlur>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {invoice.currency}
                      </div>
                    </div>
                  </div>

                  {/* Item Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-4 border-t border-border/50">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Clave Prod. Serv.
                      </div>
                      <div className="font-mono text-sm">
                        {item.productServiceKey}
                      </div>
                    </div>
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
                      <div className="font-mono text-sm">
                        <PrivacyBlur>${item.unitPrice}</PrivacyBlur>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Dscto.
                      </div>
                      <div className="font-mono text-sm">
                        <PrivacyBlur>${item.discount}</PrivacyBlur>
                      </div>
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
                          <div
                            key={tax.id}
                            className="flex items-baseline gap-2"
                          >
                            <span className="text-sm font-medium">
                              {tax.taxName}
                            </span>
                            <span className="text-xs text-muted-foreground lowercase">
                              {getTaxType(tax.taxType as TaxTypes)} • {tax.rate}
                            </span>
                            <span className="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              <PrivacyBlur>${tax.taxAmount}</PrivacyBlur>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingPayment && (
        <EditPaymentDialog
          payment={editingPayment}
          invoiceDate={new Date(invoice.invoiceDate)}
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
        />
      )}

      {cancelDialogOpen && (
        <CancelInvoiceDialog
          invoiceId={invoice.id}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
        />
      )}

      {refundDialogOpen && (
        <RegisterRefundDialog
          invoiceId={invoice.id}
          amountPaid={invoice.amountPaid || "0.00"}
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
        />
      )}

      {linkDialogOpen && (
        <LinkPaymentComplementDialog
          invoiceId={invoice.id}
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
        />
      )}
    </div>
  );
}
