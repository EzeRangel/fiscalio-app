import { businessPartners, getDB } from "@/db";
import { eq } from "drizzle-orm";
import "server-only";

export const getBusinessPartners = async (organizationId?: number) => {
  if (!organizationId) {
    return [];
  }

  const { db } = await getDB();

  const results = await db
    .select()
    .from(businessPartners)
    .where(eq(businessPartners.organizationId, organizationId));

  return results;
};
