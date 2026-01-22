
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { faker } from '@faker-js/faker';
import { organizations } from '../db/schema/organizations';
import { businessPartners } from '../db/schema/businessPartners';
import { invoices } from '../db/schema/invoices';
import { DB_PATH } from "@/lib/db-path";

async function main() {
  const pg = new PGlite(DB_PATH);
  const db = drizzle(pg);

  console.log("Seeding test data...");

  // Create a test organization
  const rfc = faker.string.alphanumeric(12).toUpperCase();
  const [organization] = await db.insert(organizations).values({
    businessName: 'Test Organization ' + rfc,
    rfc: rfc,
    taxRegimeId: 1, // Assuming a tax regime with ID 1 exists
  }).returning();

  console.log(`Created organization: ${organization.businessName}`);

  // Create a test business partner
  const [partner] = await db.insert(businessPartners).values({
    organizationId: organization.id,
    partnerType: 'client',
    businessName: faker.company.name(),
    rfc: faker.string.alphanumeric(13).toUpperCase(),
    taxRegimeId: 1, // Assuming a tax regime with ID 1 exists
  }).returning();

  console.log(`Created business partner: ${partner.businessName}`);

  // Create 5 test invoices
  for (let i = 0; i < 5; i++) {
    const subtotal = parseFloat(faker.finance.amount());
    const total = subtotal * 1.16; // Assuming 16% tax

    await db.insert(invoices).values({
      organizationId: organization.id,
      partnerId: partner.id,
      invoiceType: 'income',
      cfdiType: 'I',
      invoiceDate: faker.date.past(),
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: i % 2 === 0 ? 'PUE' : 'PPD', // Half PUE, half PPD
    });
  }

  console.log("Created 5 test invoices.");

  console.log("Seeding completed.");

  await pg.close();
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
