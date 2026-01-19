"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { getActiveOrganizationId } from "@/lib/session";
import { getDashboardMetrics } from "@/data/dashboard";
import { getInvoicesByPeriod } from "@/data/invoices";

const schema = z.object({
  month: z.number().min(0).max(11),
  year: z.number().min(2000).max(2100),
});

export const getDashboardMetricsAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput: { month, year } }) => {
    const organizationId = await getActiveOrganizationId();
    
    return await getDashboardMetrics(organizationId, { month, year });
  });

export const getInvoicesByPeriodAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput: { month, year } }) => {
    const organizationId = await getActiveOrganizationId();
    return await getInvoicesByPeriod(organizationId, { month, year });
  });
