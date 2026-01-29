import "server-only";
import { classificationSnapshots, getDB } from "@/db";
import { EngineInvoice } from "@/types/classification-engine";
import { ClassificationEngine } from "@/lib/classification-engine";
import { getInvoiceById } from "./invoices";
import { getClassificationRules } from "./classification-rules";

export async function suggestInvoiceClassification(invoiceId: number) {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new Error("La factura no fue encontrada para clasificar");
  }

  // Payment Complements do not require classification
  if (invoice.cfdiType === "P") {
    return [];
  }

  const { db } = await getDB();
  const rules = await getClassificationRules();
  const classificationEngine = new ClassificationEngine();

  const engineInvoice: EngineInvoice = {
    cfdiType: invoice.cfdiType,
    currency: invoice.currency,
    paymentForm: invoice.paymentForm,
    partnerId: invoice.partnerId,
    partnerRfc: invoice.businessPartner?.rfc || null,
    items: invoice.items.map((item) => ({
      productServiceKey: item.productServiceKey,
    })),
    invoiceType: invoice.invoiceType,
    taxes: invoice.items.flatMap((item) =>
      item.taxes
        .filter((t) => t.rate !== null)
        .map((tax) => ({
          rate: parseFloat(tax.rate!),
          taxCode: tax.taxCode,
          taxType: tax.taxType,
        })),
    ),
  };

  const candidates = classificationEngine.run(engineInvoice, rules);

  if (Array.isArray(candidates) && candidates.length >= 1) {
    await db.insert(classificationSnapshots).values({
      invoiceId: invoiceId,
      candidates: candidates,
    });

    return candidates;
  }

  return [];
}
