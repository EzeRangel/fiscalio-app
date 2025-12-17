import "server-only";
import { getDB, taxRegimes } from "@/db";

export const getTaxRegimes = async () => {
  const { db } = await getDB();

  const regimes = await db.select().from(taxRegimes);

  return regimes;
};
