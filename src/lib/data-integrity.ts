import { getDB } from "@/db/drizzle";
import { invoices } from "@/db/schema/invoices";
import { eq, and } from "drizzle-orm";
import { ActionError } from "./errors";
import crypto from "crypto";

/**
 * Generates a SHA-256 hash of the provided content.
 */
export function generateFileHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Checks if an invoice with the same file hash already exists in the organization.
 */
export async function checkFileHashUniqueness(
  organizationId: number,
  fileHash: string
): Promise<void> {
  const { db } = await getDB();

  const existing = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.fileHash, fileHash)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ActionError("Este archivo ya ha sido importado.");
  }
}

/**
 * Checks if an invoice with the same Folio Fiscal (UUID) already exists in the organization.
 */
export async function checkFolioFiscalUniqueness(
  organizationId: number,
  folioFiscal: string
): Promise<void> {
  const { db } = await getDB();

  const existing = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.folioFiscal, folioFiscal)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ActionError(
      "Una factura con este UUID (Folio Fiscal) ya está registrada."
    );
  }
}
