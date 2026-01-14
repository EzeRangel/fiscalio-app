"use server";

import { getDB } from "@/db/drizzle";
import { businessPartners } from "@/db/schema/businessPartners";
import { actionClient } from "@/lib/safe-action";
import {
  organizationAddressSchema,
  organizationContactSchema,
} from "@/types/organizations";
import { revalidateTag, revalidatePath } from "next/cache";
import { zfd } from "zod-form-data";
import z from "zod/v4";
import { getActiveOrganizationId } from "@/lib/session";
import { fetchBusinessPartnersByOrg } from "@/data/businessPartners";
import { and, eq } from "drizzle-orm";
import { logAction, calculateDiff } from "@/lib/audit-service";

const insertBusinessPartnerFormSchema = zfd.formData({
  businessName: zfd.text(z.string()),
  rfc: zfd.text(z.string()),
  partnerType: zfd.text(z.enum(["client", "partner", "both"])),
  legalName: zfd.text(z.string().optional()),
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
    const organizationId = await getActiveOrganizationId();

    const [newPartner] = await db
      .insert(businessPartners)
      .values({
        ...parsedInput,
        organizationId,
      })
      .returning();

    await logAction({
      organizationId,
      entityType: "business_partner",
      entityId: newPartner.id,
      action: "created",
      metadata: { source: "manual" },
    });

    revalidateTag("contacts", "max");
  });

export const getBusinessPartnersByOrg = actionClient.action(async () => {
  const organizationId = await getActiveOrganizationId();

  return fetchBusinessPartnersByOrg(organizationId);
});

const updateTagsSchema = z.object({
  partnerId: z.number(),
  tags: z.array(z.string()),
});

export const updateBusinessPartnerTags = actionClient
  .inputSchema(updateTagsSchema)
  .action(async ({ parsedInput }) => {
    const { partnerId, tags } = parsedInput;
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();

    const oldPartner = await db.query.businessPartners.findFirst({
      where: and(
        eq(businessPartners.id, partnerId),
        eq(businessPartners.organizationId, organizationId)
      ),
    });

    await db
      .update(businessPartners)
      .set({ tags })
      .where(
        and(
          eq(businessPartners.id, partnerId),
          eq(businessPartners.organizationId, organizationId)
        )
      );

    if (oldPartner) {
      const changes = calculateDiff(
        { tags: oldPartner.tags },
        { tags: tags }
      );

      if (Object.keys(changes).length > 0) {
        await logAction({
          organizationId,
          entityType: "business_partner",
          entityId: partnerId,
          action: "updated",
          changes,
          metadata: { source: "manual", reason: "Tags update" },
        });
      }
    }

    revalidatePath("/partners");
    return { success: true };
  });
