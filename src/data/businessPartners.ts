import { businessPartners, getDB } from "@/db";
import { eq } from "drizzle-orm";
import "server-only";

export const fetchBusinessPartnersByOrg = async (organizationId: number) => {
  const { db } = await getDB();

  const results = await db
    .select()
    .from(businessPartners)
    .where(eq(businessPartners.organizationId, organizationId));

  return results;
};
