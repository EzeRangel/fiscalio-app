import "server-only";
import { getDB } from "@/db";
import { invoices } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function loadInvoiceForCancellation(id: number, organizationId: number) {
  const { db } = await getDB();
  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, organizationId)
    ),
    with: {
      refundPayments: true,
      allocations: true,
    },
  });
}

export async function getInvoiceByFolioFiscal(folioFiscal: string, organizationId: number) {
  const { db } = await getDB();
  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.folioFiscal, folioFiscal),
      eq(invoices.organizationId, organizationId)
    ),
  });
}

export async function updateInvoiceStatus(
  id: number,
  organizationId: number,
  fields: {
    status: string;
    cancellationReason: string;
    cancellationReasonCode: string;
    substituteInvoiceId?: number | null;
  }
) {
  const { db } = await getDB();
  const reasonText = fields.cancellationReasonCode
    ? `${fields.cancellationReasonCode} - ${fields.cancellationReason}`
    : fields.cancellationReason;

  const rows = await db
    .update(invoices)
    .set({
      status: fields.status,
      cancellationReason: reasonText,
      cancellationDate: new Date(),
      substituteInvoiceId: fields.substituteInvoiceId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.organizationId, organizationId)
      )
    )
    .returning();

  return rows[0] || null;
}
