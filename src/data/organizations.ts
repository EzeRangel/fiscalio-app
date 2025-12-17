import "server-only";
import { getDB, organizations } from "@/db";

export const getOrganizations = async () => {
  try {
    const { db } = await getDB();

    const records = await db.select().from(organizations);

    return records;
  } catch (error) {
    console.log(error);

    return [];
  }
};
