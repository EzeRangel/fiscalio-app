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
      businessName: businessPartners.businessName,
      rfc: businessPartners.rfc,
      partnerType: businessPartners.partnerType,
      isActive: businessPartners.isActive,
      tags: businessPartners.tags,
      invoiceCount: sql<number>`COALESCE(${statsQuery.invoiceCount}, 0)`.mapWith(
        Number
      ),
      totalVolume: sql<number>`COALESCE(${statsQuery.totalVolume}, 0)`.mapWith(
        Number
      ),
    })
    .from(businessPartners)
    .leftJoin(statsQuery, eq(businessPartners.id, statsQuery.partnerId))
    .where(eq(businessPartners.organizationId, organizationId));

  return results;
};