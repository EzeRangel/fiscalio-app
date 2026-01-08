import { declarationInvoices, getDB } from "@/db";
import { eq } from "drizzle-orm";
import "server-only";

export async function getDeclarationInvoicesById(id: number) {
  const { db } = await getDB();

  const invoices = await db.query.declarationInvoices.findMany({
    where: eq(declarationInvoices.id, id),
    with: {
      invoice: {
        with: {
          businessPartner: true,
        },
      },
    },
  });

  return invoices;
}
