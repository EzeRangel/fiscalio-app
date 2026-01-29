import { classificationRules } from "@/db";
import { z } from "zod";

/**
 * A discriminated union of all possible match criteria for a classification rule.
 * These schemas define the "patterns" the system will use to recognize and classify transactions.
 * The `ruleType` property on each object serves as the discriminator.
 */
export const matchCriteriaSchema = z.union([
  /**
   * Matches one or more keywords within a specified text field (e.g., item description).
   * ruleType: 'keyword'
   */
  z.object({
    ruleType: z.literal("keyword"),
    keywords: z.array(z.string()).min(1),
    field: z.string(),
  }),

  /**
   * Matches specific business partners by their internal IDs.
   * ruleType: 'partner'
   */
  z.object({
    ruleType: z.literal("partner"),
    partnerIds: z.array(z.number()).min(1),
  }),

  /**
   * Matches one or more SAT Product/Service Keys (`ClaveProdServ`).
   * ruleType: 'product-service'
   */
  z.object({
    ruleType: z.literal("product-service"),
    productServiceKeys: z.array(z.string()).min(1),
  }),

  /**
   * Matches the CFDI `TipoDeComprobante` (I=Ingreso, E=Egreso, N=Nómina, etc.).
   * ruleType: 'cfdi-type'
   */
  z.object({
    ruleType: z.literal("cfdi-type"),
    cfdiType: z.enum(["I", "E", "N", "T", "P"]),
  }),

  /**
   * Matches the `FormaPago` (e.g., 01=Efectivo, 03=Transferencia).
   * ruleType: 'payment-form'
   */
  z.object({
    ruleType: z.literal("payment-form"),
    paymentForms: z.array(z.string()).min(1),
  }),

  /**
   * Matches the invoice `Moneda` (e.g., MXN, USD).
   * ruleType: 'currency'
   */
  z.object({
    ruleType: z.literal("currency"),
    currency: z.array(z.string()).min(1),
  }),

  /**
   * Matches the emitter's or receiver's RFC.
   * ruleType: 'rfc'
   */
  z.object({
    ruleType: z.literal("rfc"),
    rfc: z.string(),
  }),

  /**
   * Matches a specific tax rate found in the invoice.
   * ruleType: 'tax-rate'
   */
  z.object({
    ruleType: z.literal("tax"),
    taxRate: z.number(),
  }),

  /**
   * Matches an autonomous pattern discovered by the engine.
   * ruleType: 'pattern'
   */
  z.object({
    ruleType: z.literal("pattern"),
    featureSetHash: z.string(),
  }),
]);

export type MatchCriteria = z.infer<typeof matchCriteriaSchema>;

export type Rule = typeof classificationRules.$inferSelect;
