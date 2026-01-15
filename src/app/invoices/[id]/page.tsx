import { getInvoiceById } from "@/data/invoices";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDetails } from "../_components/details";
import { getPaymentsByFolio } from "@/data/payments";

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

  const relatedPayments = await getPaymentsByFolio(invoice.folioFiscal);

  return (
    <div className="min-h-screen bg-background">
      <InvoiceDetails data={invoice} relatedPayments={relatedPayments} />
    </div>
  );
}
