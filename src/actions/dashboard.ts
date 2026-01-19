"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { getActiveOrganizationId } from "@/lib/session";
import { DashboardMetrics } from "@/types/dashboard";
import { getDashboardMetrics } from "@/data/dashboard";

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
