"use server";

import { fetchBusinessPartnersWithAnalytics } from "@/data/businessPartners";
import { getDB } from "@/db/drizzle";
import { invoices } from "@/db/schema";
import { actionClient } from "@/lib/safe-action";
import { getActiveOrganizationId } from "@/lib/session";
import { eq, sql } from "drizzle-orm";

export const getPartnersWithAnalytics = actionClient.action(async () => {
  const organizationId = await getActiveOrganizationId();
  return fetchBusinessPartnersWithAnalytics(organizationId);
});

export const getGlobalPartnerStats = actionClient.action(async () => {
  const { db } = await getDB();
  const organizationId = await getActiveOrganizationId();

  const results = await db
    .select({
      type: invoices.invoiceType,
      volume: sql<number>`sum(${invoices.subtotal})`.mapWith(Number),
    })
    .from(invoices)
    .where(eq(invoices.organizationId, organizationId))
    .groupBy(invoices.invoiceType);

  const stats = {
    totalClientVolume: 0,
    totalProviderVolume: 0,
  };

  results.forEach((row) => {
    if (row.type === "income") {
      stats.totalClientVolume = row.volume || 0;
    } else if (row.type === "expense") {
      stats.totalProviderVolume = row.volume || 0;
    }
  });

  return stats;
});
