import { businessPartners, invoices, paymentAllocations, getDB } from "@/db";
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

  // Subquery for paid amounts per invoice (Normalized to MXN)
  const paidPerInvoice = db
    .select({
      invoiceId: paymentAllocations.invoiceId,
      paidAmount: sql<number>`sum(
        ${paymentAllocations.amountAllocated} * 
        CASE 
          WHEN ${paymentAllocations.exchangeRate} = 1.0 AND ${invoices.currency} != 'MXN' 
          THEN ${invoices.exchangeRate} 
          ELSE ${paymentAllocations.exchangeRate} 
        END
      )`
        .mapWith(Number)
        .as("paid_amount"),
    })
    .from(paymentAllocations)
    .innerJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .groupBy(paymentAllocations.invoiceId)
    .as("paid_per_invoice");

  // Aggregate invoice stats per partner
  const statsQuery = db
    .select({
      partnerId: invoices.partnerId,
      invoiceCount: sql<number>`count(${invoices.id})`
        .mapWith(Number)
        .as("invoice_count"),
      totalVolume: sql<number>`sum(${invoices.total} * ${invoices.exchangeRate})`
        .mapWith(Number)
        .as("total_volume"),
      paidVolume: sql<number>`sum(COALESCE(${paidPerInvoice.paidAmount}, 0))`
        .mapWith(Number)
        .as("paid_volume"),
    })
    .from(invoices)
    .leftJoin(paidPerInvoice, eq(invoices.id, paidPerInvoice.invoiceId))
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
      paidVolume: sql<number>`COALESCE(${statsQuery.paidVolume}, 0)`.mapWith(
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

  // Subquery for paid amounts per invoice (Normalized to MXN)
  const paidPerInvoice = db
    .select({
      invoiceId: paymentAllocations.invoiceId,
      paidAmount: sql<number>`sum(
        ${paymentAllocations.amountAllocated} * 
        CASE 
          WHEN ${paymentAllocations.exchangeRate} = 1.0 AND ${invoices.currency} != 'MXN' 
          THEN ${invoices.exchangeRate} 
          ELSE ${paymentAllocations.exchangeRate} 
        END
      )`
        .mapWith(Number)
        .as("paid_amount"),
    })
    .from(paymentAllocations)
    .innerJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .groupBy(paymentAllocations.invoiceId)
    .as("paid_per_invoice");

  const results = await db
    .select({
      type: invoices.invoiceType,
      volume: sql<number>`sum(${invoices.total} * ${invoices.exchangeRate})`.mapWith(Number),
      paidVolume: sql<number>`sum(COALESCE(${paidPerInvoice.paidAmount}, 0))`.mapWith(Number),
    })
    .from(invoices)
    .leftJoin(paidPerInvoice, eq(invoices.id, paidPerInvoice.invoiceId))
    .where(eq(invoices.organizationId, organizationId))
    .groupBy(invoices.invoiceType);

  const stats = {
    totalClientVolume: 0,
    totalProviderVolume: 0,
    totalClientPaidVolume: 0,
    totalProviderPaidVolume: 0,
  };

  results.forEach((row) => {
    if (row.type === "income") {
      stats.totalClientVolume = row.volume || 0;
      stats.totalClientPaidVolume = row.paidVolume || 0;
    } else if (row.type === "expense") {
      stats.totalProviderVolume = row.volume || 0;
      stats.totalProviderPaidVolume = row.paidVolume || 0;
    }
  });

  return stats;
};
