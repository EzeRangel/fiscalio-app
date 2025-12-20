"use server";

import { getLatestInvoices } from "@/data/invoices";
import { getActiveOrganizationId } from "@/lib/session";

export async function getLatestInvoicesAction() {
  const organizationId = await getActiveOrganizationId();
  return getLatestInvoices(organizationId);
}
