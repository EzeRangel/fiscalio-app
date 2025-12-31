"use client";

import { getLatestInvoicesAction } from "@/actions/get-latest-invoices";
import { useQuery } from "@tanstack/react-query";
import SummaryCards from "./summary-cards";
import { InvoicesList } from "../invoices/invoices-list";
import Uploader from "./uploader";

interface Props {
  monthName: string;
}

export default function Dashboard({ monthName }: Props) {
  const {
    data: invoices,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["latest-invoices"],
    queryFn: () => getLatestInvoicesAction(),
  });

  return (
    <section className="space-y-12">
      <SummaryCards monthName={monthName} invoices={invoices} />
      <Uploader />
      <InvoicesList invoices={invoices} />
    </section>
  );
}
