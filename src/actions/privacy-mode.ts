"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { actionClient } from "@/lib/safe-action";
import { PRIVACY_MODE_COOKIE } from "@/lib/privacy-mode";

export const togglePrivacyMode = actionClient
  .inputSchema(z.object({ enabled: z.boolean() }))
  .action(async ({ parsedInput: { enabled } }) => {
    const cookieStore = await cookies();
    cookieStore.set(PRIVACY_MODE_COOKIE, String(enabled), {
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  });
