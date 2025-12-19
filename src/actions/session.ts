"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { getActiveOrganizationId } from "@/lib/session";
import { getDB, organizations } from "@/db";
import { eq } from "drizzle-orm";

const setOrganizationSchema = z.object({
  organizationId: z.number(),
});

export const setActiveOrganization = actionClient
  .inputSchema(setOrganizationSchema)
  .action(async ({ parsedInput }) => {
    const { organizationId } = parsedInput;
    const cookieStore = await cookies();

    cookieStore.set("activeOrganizationId", organizationId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true };
  });

export const getActiveOrganization = actionClient.action(async () => {
  try {
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
    return org || null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // If getActiveOrganizationId throws (e.g., no cookie), return null
    return null;
  }
});
