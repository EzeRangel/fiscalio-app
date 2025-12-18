import { businessPartners } from "@/db/schema/businessPartners";
import { createInsertSchema } from "drizzle-zod";
import {
  organizationAddressSchema,
  organizationContactSchema,
} from "./organizations";
import z from "zod/v4";

export const insertBusinessPartnerSchema = createInsertSchema(
  businessPartners,
  {
    address: organizationAddressSchema,
    contact: organizationContactSchema,
    organizationId: z.number(),
    taxRegimeId: z.number(),
    partnerType: z.enum(["client", "partner", "both"]),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BusinessPartner = typeof businessPartners.$inferSelect;
