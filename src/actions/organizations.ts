"use server";

import { revalidatePath } from "next/cache";
import {
  organizationAddressSchema,
  organizationContactSchema,
  organizations,
} from "@/db/schema/organizations";
import { actionClient } from "@/lib/safe-action";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { getDB } from "@/db";

const insertOrganizationFormSchema = zfd.formData({
  businessName: zfd.text(),
  rfc: zfd.text(),
  legalName: zfd.text(z.string().optional()),
  taxRegimeId: zfd.text(z.coerce.number()),
  address: zfd.formData(organizationAddressSchema),
  contact: zfd.formData(organizationContactSchema),
});

export const saveOrganization = actionClient
  .inputSchema(insertOrganizationFormSchema)
  .action(async ({ parsedInput }) => {
    const { db } = await getDB();
    await db.insert(organizations).values(parsedInput);

    revalidatePath("/");
  });
