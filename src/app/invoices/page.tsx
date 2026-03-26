import { getInvoicesByOrganization } from "@/data/invoices";
import { getActiveOrganizationId } from "@/lib/session";
import InvoicesClient from "./_components/invoices-client";

const getData = async (partnerId?: number) => {
  const organizationId = await getActiveOrganizationId();
  const [invoices] = await Promise.all([
    getInvoicesByOrganization(organizationId, { partnerId }),
  ]);

  return {
    invoices,
  };
};

export default async function InvoicesList({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner } = await searchParams;
  const partnerId = partner ? parseInt(partner) : undefined;
  const { invoices } = await getData(partnerId);

  return <InvoicesClient invoices={invoices} />;
}
