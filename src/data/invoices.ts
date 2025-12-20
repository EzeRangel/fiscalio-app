import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { invoices } from "@/db/schema";
import { getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";

// TODO: Mejorar la función para obtener todas las facturas, enviar filtros como parámetros.
export const getLatestInvoices = async (organizationId: number) => {
  const { db } = await getDB();

  return db.query.invoices.findMany({
    where: and(eq(invoices.organizationId, organizationId)),
    orderBy: [desc(invoices.createdAt)],
    limit: 10,
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
