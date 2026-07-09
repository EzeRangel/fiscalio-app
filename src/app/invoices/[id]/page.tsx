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

  let relatedPayments = invoice.allocations.map((a) => a.payment);

  if (invoice.cfdiType === "P" && relatedPayments.length === 0) {
    relatedPayments = await getPaymentsByFolio(invoice.folioFiscal);
  }

  if ((invoice as any).refundPayments && (invoice as any).refundPayments.length > 0) {
    relatedPayments = [...relatedPayments, ...(invoice as any).refundPayments];
  }

  return (
    <div className="min-h-screen bg-background">
      <InvoiceDetails data={invoice} relatedPayments={relatedPayments} />
      <EntityAuditLog entityType="invoice" entityId={invoice.id} />
    </div>
  );
}
