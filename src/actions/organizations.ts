"use server";

import { revalidatePath } from "next/cache";
import { organizations } from "@/db/schema/organizations";
import { actionClient } from "@/lib/safe-action";
import { zfd } from "zod-form-data";
import { getDB } from "@/db";
import {
  baseOrganizationSchema,
  insertOrganizationSchema,
} from "@/types/organizations";
import { seedDefaultChartOfAccounts } from "@/data/chart-of-accounts";
import { setActiveOrganization } from "./session";

export const createOnboardingOrganization = actionClient
  .inputSchema(baseOrganizationSchema) // Use the base schema
  .action(async ({ parsedInput }) => {
    const { db } = await getDB();
    const [newOrg] = await db
      .insert(organizations)
      .values(parsedInput)
      .returning({ id: organizations.id });

    console.log(newOrg);

    if (newOrg) {
      await seedDefaultChartOfAccounts(newOrg.id);
      await setActiveOrganization({ organizationId: newOrg.id });
    }

    revalidatePath("/");
  });

const insertOrganizationFormSchema = zfd.formData(insertOrganizationSchema);

export const saveOrganization = actionClient
  .inputSchema(insertOrganizationFormSchema)
  .action(async ({ parsedInput }) => {
    const { db } = await getDB();
    const newOrgId = await db
      .insert(organizations)
      .values(parsedInput)
      .returning({ id: organizations.id });

    if (newOrgId.length > 0) {
      await seedDefaultChartOfAccounts(newOrgId[0].id);
    }

    revalidatePath("/");
  });
