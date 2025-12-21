import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { invoices } from "@/db/schema";
import { getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";

// TODO: Mejorar la función para obtener todas las facturas, enviar filtros como parámetros.
export const getInvoicesByOrganization = async (organizationId: number) => {
  const { db } = await getDB();

  return db.query.invoices.findMany({
    where: eq(invoices.organizationId, organizationId),
    orderBy: [desc(invoices.invoiceDate)],
    with: {
      businessPartner: true,
    },
  });
};

export const getLatestInvoices = async (organizationId: number) => {
  const { db } = await getDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return db.query.invoices.findMany({
    where: and(
      eq(invoices.organizationId, organizationId),
      gte(invoices.invoiceDate, startOfMonth),
      lte(invoices.invoiceDate, endOfMonth),
    ),
    orderBy: [desc(invoices.invoiceDate)],
    with: {
      businessPartner: true,
    },
  });
};

export const getInvoiceById = async (id: number) => {
  const { db } = await getDB();
  const organizationId = await getActiveOrganizationId(); // Still needed for filtering
  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, organizationId)
    ),
    with: {
      businessPartner: true,
      items: {
        with: {
          taxes: true,
        },
      },
    },
  });
};
