import "server-only";
import { getDB, taxRegimes } from "@/db";
import { eq } from "drizzle-orm";

export const getTaxRegimes = async () => {
  const { db } = await getDB();

  const regimes = await db.select().from(taxRegimes);

  return regimes;
};

export const findTaxRegimeByCode = async (code: string) => {
  const { db } = await getDB();

  const regime = await db.query.taxRegimes.findFirst({
    where: eq(taxRegimes.code, code),
  });

  return regime;
};
