import { db } from "@/db";
import { invoices, payments, paymentAllocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuditService } from "@/lib/audit-service";

export async function backfillPuePayments(
  dbClient: typeof db,
  auditService: AuditService
) {
  // 1. Identify PUE invoices that might be missing allocations
  // We fetch 'PUE' invoices and include their allocations to check locally
  // (Alternatively, we could do a more complex SQL query to filter at the DB level, 
  // but checking array length in code is simpler for this logic)
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
          partnerId: invoice.partnerId!, // Assuming partnerId exists for valid invoices
          paymentType: invoice.invoiceType, 
          paymentDate: invoice.invoiceDate,
          paymentMethod: invoice.paymentForm || "03", // Default to Transfer if missing, or use paymentForm from invoice
          currency: invoice.currency || "MXN",
          exchangeRate: invoice.exchangeRate || "1.0",
          amount: invoice.total,
          notes: "Auto-generated payment for PUE invoice via backfill script",
        })
        .returning();

      // Log Payment Creation
      await auditService.log(
        "create",
        "payment",
        newPayment.id.toString(),
        {
          userId: "system",
          userName: "Backfill Script",
        },
        newPayment
      );

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
      await auditService.log(
        "create",
        "payment_allocation",
        newAllocation.id.toString(),
        {
          userId: "system",
          userName: "Backfill Script",
        },
        newAllocation
      );
    });
  }
}
