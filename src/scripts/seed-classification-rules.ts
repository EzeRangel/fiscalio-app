import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { eq, isNull } from "drizzle-orm";
import { organizations } from "../db/schema/organizations";
import { classificationRules } from "../db/schema/classificationRules";
import { DB_PATH } from "@/lib/db-path";
import { BASE_RULES } from "@/lib/constants";
import { MatchCriteria } from "@/types/classification-rules";

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
    const rulesForOrg = BASE_RULES.map((rule) => ({
      ...rule,
      organizationId: org.id,
      matchCriteria: rule.matchCriteria as MatchCriteria,
    }));

    await db.insert(classificationRules).values(rulesForOrg);
  }

  console.log("Se ha completado el seeding para las reglas de clasificación.");
  await pg.close();
}

main().catch((err) => {
  console.error("Error seeding classification rules:", err);
  process.exit(1);
});
