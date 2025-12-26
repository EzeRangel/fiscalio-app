import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { eq, isNull } from "drizzle-orm";
import { organizations } from "../db/schema/organizations";
import { classificationRules } from "../db/schema/classificationRules";
import { DB_PATH } from "@/lib/db-path";
import { MatchCriteria } from "@/types/classification-rules";

type NewRule = Omit<
  typeof classificationRules.$inferInsert,
  "id" | "organizationId"
>;

const BASE_RULES: NewRule[] = [
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
    accountCode: "4000", // Ingresos
    priority: 50,
    confidenceBoost: "0.60",
  },
  {
    ruleName: "CFDI de Egreso",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "E" },
    accountCode: "5000", // Gastos
    priority: 50,
    confidenceBoost: "0.60",
  },
  {
    ruleName: "Transacción con RFC Extranjero",
    ruleType: "rfc",
    matchCriteria: { ruleType: "rfc", rfc: "XEXX010101000" },
    accountCode: "5000", // Gastos
    priority: 50,
    confidenceBoost: "0.4",
  },
  {
    ruleName: "Factura con IVA 0%",
    ruleType: "tax",
    matchCriteria: { ruleType: "tax", taxRate: 0 },
    accountCode: "5000", // Gastos
    priority: 40,
    confidenceBoost: "0.4",
  },
  {
    ruleName: "Moneda Extranjera (USD)",
    ruleType: "currency",
    matchCriteria: { ruleType: "currency", currency: ["USD", "EUR"] },
    accountCode: "5000", // Gastos
    priority: 45,
    confidenceBoost: "0.30",
  },
  {
    ruleName: "Pago con Transferencia",
    ruleType: "payment-form",
    matchCriteria: { ruleType: "payment-form", paymentForms: ["03"] },
    accountCode: "5000", // Gastos
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

async function seedRulesForOrg(orgId: number, db: ReturnType<typeof drizzle>) {
  console.log(
    `- Añadiendo ${BASE_RULES.length} reglas paara la organización con el ID: ${orgId}...`
  );

  const rulesForOrg = BASE_RULES.map((rule) => ({
    ...rule,
    organizationId: orgId,
    matchCriteria: rule.matchCriteria as MatchCriteria,
  }));

  await db.insert(classificationRules).values(rulesForOrg);
}

async function main() {
  const pg = new PGlite(DB_PATH);
  const db = drizzle(pg);

  console.log(
    "Iniciando seeder de reglas de clasificación para las organizaciones actuales..."
  );

  const orgsWithoutRules = await db
    .select({ id: organizations.id, businessName: organizations.businessName })
    .from(organizations)
    .leftJoin(
      classificationRules,
      eq(organizations.id, classificationRules.organizationId)
    )
    .where(isNull(classificationRules.id))
    .groupBy(organizations.id);

  if (orgsWithoutRules.length === 0) {
    console.log(
      "Todas las organizaciones tienen reglas de clasificación asignadas. Nada qué hacer."
    );
    await pg.close();
    return;
  }

  console.log(
    `${orgsWithoutRules.length} organización(es) que necesitan reglas base.`
  );

  for (const org of orgsWithoutRules) {
    await seedRulesForOrg(org.id, db);
  }

  console.log("Seeding of classification rules completed successfully.");
  await pg.close();
}

main().catch((err) => {
  console.error("Error seeding classification rules:", err);
  process.exit(1);
});
