"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

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
