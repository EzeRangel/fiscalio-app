import { businessPartners, invoices, getDB } from "@/db";
import { eq, sql } from "drizzle-orm";
import "server-only";

export const fetchBusinessPartnersByOrg = async (organizationId: number) => {
  const { db } = await getDB();

  const results = await db
    .select()
    .from(businessPartners)
    .where(eq(businessPartners.organizationId, organizationId));

  return results;
};

export const fetchBusinessPartnersWithAnalytics = async (
  organizationId: number
) => {
  const { db } = await getDB();

  // Aggregate invoice stats per partner
  const statsQuery = db
    .select({
      partnerId: invoices.partnerId,
      invoiceCount: sql<number>`count(${invoices.id})`
        .mapWith(Number)
        .as("invoice_count"),
      totalVolume: sql<number>`sum(${invoices.subtotal})`
        .mapWith(Number)
        .as("total_volume"),
    })
    .from(invoices)
    .where(eq(invoices.organizationId, organizationId))
    .groupBy(invoices.partnerId)
    .as("stats");

  // Join partners with their stats
  const results = await db
    .select({
      id: businessPartners.id,
      legalName: businessPartners.legalName,
      businessName: businessPartners.businessName,
      rfc: businessPartners.rfc,
      partnerType: businessPartners.partnerType,
      isActive: businessPartners.isActive,
      tags: businessPartners.tags,
      creditLimit: businessPartners.creditLimit,
      invoiceCount:
        sql<number>`COALESCE(${statsQuery.invoiceCount}, 0)`.mapWith(Number),
      totalVolume: sql<number>`COALESCE(${statsQuery.totalVolume}, 0)`.mapWith(
        Number
      ),
    })
    .from(businessPartners)
    .leftJoin(statsQuery, eq(businessPartners.id, statsQuery.partnerId))
    .where(eq(businessPartners.organizationId, organizationId));

  return results;
};

export const fetchGlobalPartnerStats = async (organizationId: number) => {
  const { db } = await getDB();

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
};
