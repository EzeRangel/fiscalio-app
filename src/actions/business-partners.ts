"use server";

import { getDB } from "@/db/drizzle";
import { businessPartners } from "@/db/schema/businessPartners";
import { actionClient } from "@/lib/safe-action";
import {
  organizationAddressSchema,
  organizationContactSchema,
} from "@/types/organizations";
import { revalidateTag } from "next/cache";
import { zfd } from "zod-form-data";
import z from "zod/v4";

const insertBusinessPartnerFormSchema = zfd.formData({
  businessName: zfd.text(z.string()),
  rfc: zfd.text(z.string()),
  partnerType: zfd.text(z.enum(["client", "partner", "both"])),
  legalName: zfd.text(z.string().optional()),
  organizationId: zfd.text(z.coerce.number()),
  taxRegimeId: zfd.text(z.coerce.number()),
  address: zfd.formData(organizationAddressSchema.optional()),
  contact: zfd.formData(organizationContactSchema.optional()),
  paymentTerms: zfd.text(z.coerce.number().optional()).optional(),
  creditLimit: zfd.text(z.string().optional()),
  notes: zfd.text(z.string().optional()),
  tags: zfd.text(
    z
      .string()
      .optional()
      .transform((val) =>
        val ? val.split(",").map((s) => s.trim()) : undefined
      )
  ),
});

export const saveBusinessPartner = actionClient
  .inputSchema(insertBusinessPartnerFormSchema)
  .action(async ({ parsedInput }) => {
    const { db } = await getDB();
    await db.insert(businessPartners).values(parsedInput);

    revalidateTag("contacts", "max");
  });
