import { organizations } from "@/db/schema/organizations";
import z from "zod/v4";

// Base schema for core organization fields
export const baseOrganizationSchema = z.object({
  businessName: z.string().min(3, "El nombre del negocio es requerido"),
  rfc: z.string().min(12, "El RFC debe contener al menos 12 caracteres"),
  taxRegimeId: z
    .string()
    .min(1, "Selecciona un régimen fiscal")
    .pipe(z.coerce.number()),
});

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

// Schema for inserting a new organization, extending the base
export const insertOrganizationSchema = baseOrganizationSchema.extend({
  legalName: z.string().optional(),
  address: organizationAddressSchema.optional(),
  contact: organizationContactSchema.optional(),
});

export type Organization = typeof organizations.$inferSelect;
