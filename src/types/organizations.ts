import { organizations } from "@/db/schema/organizations";
import { createInsertSchema } from "drizzle-zod";
import z from "zod/v4";

export const organizationAddressSchema = z.object({
  street: z.string(),
  exterior: z.string(),
  interior: z.string().optional(),
  colony: z.string(),
  municipality: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
});

export const organizationContactSchema = z.object({
  email: z.email(),
  phone: z.string().optional(),
  website: z.url().optional(),
});

export const insertOrganizationSchema = createInsertSchema(organizations, {
  address: organizationAddressSchema,
  contact: organizationContactSchema,
  taxRegimeId: z.number(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Organization = typeof organizations.$inferSelect;
