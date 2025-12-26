import { getDB } from "@/db/drizzle";
import { classificationRules } from "@/db/schema/classificationRules";
import { getActiveOrganizationId } from "@/lib/session";
import { MatchCriteria } from "@/types/classification-rules";
import { desc, eq } from "drizzle-orm";
import "server-only";

type NewRule = Omit<
  typeof classificationRules.$inferInsert,
  "id" | "organizationId"
>;

export const BASE_RULES: NewRule[] = [
  {
    ruleName: "CFDI Nómina",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "N" },
    accountCode: "5000", // Gastos
    priority: 70,
    confidenceBoost: "0.50",
  },
  {
    ruleName: "Combustibles y Lubricantes",
    ruleType: "product-service",
    matchCriteria: {
      ruleType: "product-service",
      productServiceKeys: ["15101500", "15101505", "15101514", "15101515"],
    },
    accountCode: "5000", // Gastos
    priority: 75,
    confidenceBoost: "0.45",
  },
  {
    ruleName: "Servicios Profesionales",
    ruleType: "product-service",
    matchCriteria: {
      ruleType: "product-service",
      productServiceKeys: ["80101500", "80111600"],
    },
    accountCode: "5000", // Gastos
    priority: 65,
    confidenceBoost: "0.40",
  },

  // --- Foundational / Signal Rules (with generic accounts) ---
  {
    ruleName: "CFDI de Ingreso",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "I" },
    accountCode: null,
    priority: 40,
    confidenceBoost: "0.30",
  },
  {
    ruleName: "CFDI de Egreso",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "E" },
    accountCode: null,
    priority: 70,
    confidenceBoost: "0.50",
  },
  {
    ruleName: "Transacción con RFC Extranjero",
    ruleType: "rfc",
    matchCriteria: { ruleType: "rfc", rfc: "XEXX010101000" },
    accountCode: null,
    priority: 50,
    confidenceBoost: "0.4",
  },
  {
    ruleName: "Factura con IVA 0%",
    ruleType: "tax",
    matchCriteria: { ruleType: "tax", taxRate: 0 },
    accountCode: null,
    priority: 40,
    confidenceBoost: "0.4",
  },
  {
    ruleName: "Moneda Extranjera (USD)",
    ruleType: "currency",
    matchCriteria: { ruleType: "currency", currency: ["USD", "EUR"] },
    accountCode: null,
    priority: 45,
    confidenceBoost: "0.30",
  },
  {
    ruleName: "Pago con Transferencia",
    ruleType: "payment-form",
    matchCriteria: { ruleType: "payment-form", paymentForms: ["03"] },
    accountCode: null,
    priority: 30,
    confidenceBoost: "0.15",
  },
  {
    ruleName: "Plantilla de Contacto/Proveedor",
    ruleType: "partner",
    matchCriteria: { ruleType: "partner", partnerIds: [] },
    accountCode: "5000", // Gastos
    priority: 50,
    confidenceBoost: "0.20",
  },
];

export async function getClassificationRules() {
  const organizationId = await getActiveOrganizationId();
  const { db } = await getDB();

  return await db.query.classificationRules.findMany({
    where: eq(classificationRules.organizationId, organizationId),
    orderBy: [desc(classificationRules.createdAt)],
  });
}

export async function seedDefaultRulesForOrg(orgId: number) {
  const rulesForOrg = BASE_RULES.map((rule) => ({
    ...rule,
    organizationId: orgId,
    matchCriteria: rule.matchCriteria as MatchCriteria,
  }));

  const { db } = await getDB();

  await db.insert(classificationRules).values(rulesForOrg);
}
