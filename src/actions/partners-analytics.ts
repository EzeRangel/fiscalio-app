"use server";

import { getDB } from "@/db/drizzle";
import { businessPartners, invoices } from "@/db/schema";
import { actionClient } from "@/lib/safe-action";
import { getActiveOrganizationId } from "@/lib/session";
import { eq, sql, and } from "drizzle-orm";

export const getPartnersWithAnalytics = actionClient.action(async () => {
  const { db } = await getDB();
  const organizationId = await getActiveOrganizationId();

  // Aggregate invoice stats per partner
  const statsQuery = db
    .select({
      partnerId: invoices.partnerId,
      invoiceCount: sql<number>`count(${invoices.id})`.mapWith(Number).as("invoice_count"),
      totalVolume: sql<number>`sum(${invoices.subtotal})`.mapWith(Number).as("total_volume"),
    })
    .from(invoices)
    .where(eq(invoices.organizationId, organizationId))
    .groupBy(invoices.partnerId)
    .as("stats");

  // Join partners with their stats
  const results = await db
    .select({
      id: businessPartners.id,
      businessName: businessPartners.businessName,
      rfc: businessPartners.rfc,
      partnerType: businessPartners.partnerType,
      isActive: businessPartners.isActive,
      invoiceCount: sql<number>`COALESCE(${statsQuery.invoiceCount}, 0)`.mapWith(Number),
      totalVolume: sql<number>`COALESCE(${statsQuery.totalVolume}, 0)`.mapWith(Number),
    })
    .from(businessPartners)
    .leftJoin(statsQuery, eq(businessPartners.id, statsQuery.partnerId))
    .where(eq(businessPartners.organizationId, organizationId));

  return results;
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