import { getDB } from "@/db/drizzle";
import { classificationRules } from "@/db/schema/classificationRules";
import { BASE_RULES } from "@/lib/constants";
import { getActiveOrganizationId } from "@/lib/session";
import { MatchCriteria } from "@/types/classification-rules";
import { desc, eq } from "drizzle-orm";
import "server-only";

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
