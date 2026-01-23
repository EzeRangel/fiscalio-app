import { getInvoiceById } from "@/data/invoices";
import { notFound } from "next/navigation";
import { InvoiceDetails } from "../_components/details";
import { getPaymentsByFolio } from "@/data/payments";
import { EntityAuditLog } from "@/components/EntityAuditLog";

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;

  const invoiceId = parseInt(id);

  if (isNaN(invoiceId)) {
    notFound();
  }

  const invoice = await getInvoiceById(invoiceId);

  if (!invoice || !invoice.folioFiscal) {
    notFound();
  }

  // Derive payments from allocations (PUE/PPD Invoices)
  // For Payment Complements (Type P), this might need specific handling if not linked via allocations
  let relatedPayments = invoice.allocations.map((a) => a.payment);

  if (invoice.cfdiType === "P" && relatedPayments.length === 0) {
    relatedPayments = await getPaymentsByFolio(invoice.folioFiscal);
  }

  return (
    <div className="min-h-screen bg-background">
      <InvoiceDetails data={invoice} relatedPayments={relatedPayments} />
      <EntityAuditLog entityType="invoice" entityId={invoice.id} />
    </div>
  );
}
