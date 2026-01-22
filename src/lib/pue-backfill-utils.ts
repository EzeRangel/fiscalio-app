import { db } from "@/db";
import { invoices, payments, paymentAllocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAction } from "@/lib/audit-service";

export async function backfillPuePayments(
  dbClient: typeof db,
) {
  // 1. Identify PUE invoices that might be missing allocations
  const pueInvoices = await dbClient.query.invoices.findMany({
    where: eq(invoices.paymentMethod, "PUE"),
    with: {
      allocations: true,
    },
  });

  // Filter for those with NO allocations
  const missingPayments = pueInvoices.filter(
    (inv) => inv.allocations.length === 0
  );

  console.log(`Found ${pueInvoices.length} PUE invoices. ${missingPayments.length} are missing payments.`);

  for (const invoice of missingPayments) {
    await dbClient.transaction(async (tx) => {
      // 2. Create Payment
      const [newPayment] = await tx
        .insert(payments)
        .values({
          organizationId: invoice.organizationId,
          partnerId: invoice.partnerId!, 
          paymentType: invoice.invoiceType, 
          paymentDate: invoice.invoiceDate,
          paymentMethod: invoice.paymentForm || "99", // Default to 'Por definir' if missing
          currency: invoice.currency || "MXN",
          exchangeRate: invoice.exchangeRate || "1.0",
          amount: invoice.total,
          notes: "Auto-generated payment for PUE invoice via backfill script",
        })
        .returning();

      // Log Payment Creation
      await logAction({
        action: "created",
        entityType: "payment",
        entityId: newPayment.id,
        organizationId: invoice.organizationId,
        metadata: {
            reason: "PUE Backfill",
            source: "manual", // or 'system' if added to enum
        },
        tx,
      });

      // 3. Create Allocation
      const [newAllocation] = await tx
        .insert(paymentAllocations)
        .values({
          paymentId: newPayment.id,
          invoiceId: invoice.id,
          amountAllocated: invoice.total,
          exchangeRate: invoice.exchangeRate || "1.0",
        })
        .returning();

      // Log Allocation Creation
      await logAction({
        action: "created",
        entityType: "payment_allocation",
        entityId: newAllocation.id,
        organizationId: invoice.organizationId,
        metadata: {
            reason: "PUE Backfill",
            source: "manual",
        },
        tx,
      });
      
      // Update Invoice Status
      await tx
        .update(invoices)
        .set({
            amountPaid: invoice.total,
            paymentStatus: "paid",
        })
        .where(eq(invoices.id, invoice.id));
    });
  }
}