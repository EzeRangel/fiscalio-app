"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { getDB, payments, invoices, paymentAllocations } from "@/db";
import { eq, and } from "drizzle-orm";
import { logAction } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";
import { ActionError } from "@/lib/errors";

export const updatePaymentSchema = z.object({
  paymentId: z.number(),
  paymentDate: z.date(),
  notes: z.string().optional(),
});
