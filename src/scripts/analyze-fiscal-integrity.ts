import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { DB_PATH } from "@/lib/db-path";
import * as schema from "../db/schema";
import {
  validateInvoice,
  validatePayment,
  validateAllocation,
} from "@/lib/fiscal-validation";

async function analyze() {
  const pg = new PGlite(DB_PATH);
  const db = drizzle(pg, { schema });

  console.log("--- Fiscal Integrity Analysis ---");

  // 1. Check Invoices
  console.log("\nChecking Invoices...");
  const allInvoices = await db.query.invoices.findMany({
    with: {
      allocations: true,
    },
  });

  let invoiceViolations = 0;
  for (const inv of allInvoices) {
    const validation = validateInvoice({
      id: inv.id,
      total: inv.total,
      subtotal: inv.subtotal,
      amountPaid: inv.amountPaid || "0",
      paymentStatus: inv.paymentStatus || "pending",
      status: inv.status || "active",
      allocations: inv.allocations.map((a) => ({ amount: a.amountAllocated })),
    });

    if (!validation.isValid) {
      invoiceViolations++;
      console.error(`[Invoice #${inv.id}] ${inv.folioFiscal || "No Folio"}:`);
      validation.errors.forEach((e) =>
        console.error(`  - ${e.code}: ${e.message}`),
      );
    }
  }

  // 2. Check Payments
  console.log("\nChecking Payments...");
  const allPayments = await db.query.payments.findMany({
    with: {
      allocations: true,
    },
  });

  let paymentViolations = 0;
  for (const pay of allPayments) {
    const validation = validatePayment({
      id: pay.id,
      amount: pay.amount,
      paymentDate: pay.paymentDate,
      allocations: pay.allocations.map((a) => ({ amount: a.amountAllocated })),
    });

    if (!validation.isValid) {
      paymentViolations++;
      console.error(`[Payment #${pay.id}]:`);
      validation.errors.forEach((e) =>
        console.error(`  - ${e.code}: ${e.message}`),
      );
    }
  }

  // 3. Check Allocations
  console.log("\nChecking Allocations...");
  const allAllocations = await db.query.paymentAllocations.findMany({
    with: {
      invoice: true,
      payment: true,
    },
  });

  let allocationViolations = 0;
  for (const alloc of allAllocations) {
    // We validate each allocation in its context.
    // To be efficient, we might need more data, but let's do basic context.
    const validation = validateAllocation({
      allocation: {
        amount: alloc.amountAllocated,
        invoiceId: alloc.invoiceId,
        paymentId: alloc.paymentId,
      },
      invoice: {
        id: alloc.invoice.id,
        total: alloc.invoice.total,
        subtotal: alloc.invoice.subtotal,
        amountPaid: alloc.invoice.amountPaid || "0",
        paymentStatus: alloc.invoice.paymentStatus || "pending",
        status: alloc.invoice.status || "active",
      },
      payment: {
        id: alloc.payment.id,
        amount: alloc.payment.amount,
        paymentDate: alloc.payment.paymentDate,
      },
      // Note: We don't easily have "existingAllocations" here without more queries.
      // But we can at least check ALL-01 and ALL-02.
    });

    if (!validation.isValid) {
      allocationViolations++;
      console.error(`[Allocation #${alloc.id}]:`);
      validation.errors.forEach((e) =>
        console.error(`  - ${e.code}: ${e.message}`),
      );
    }
  }

  console.log("\n--- Summary ---");
  console.log(
    `Invoices checked: ${allInvoices.length} (${invoiceViolations} violations)`,
  );
  console.log(
    `Payments checked: ${allPayments.length} (${paymentViolations} violations)`,
  );
  console.log(
    `Allocations checked: ${allAllocations.length} (${allocationViolations} violations)`,
  );

  await pg.close();
}

analyze()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
