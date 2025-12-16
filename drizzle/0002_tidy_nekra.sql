ALTER TABLE "organizations" DROP COLUMN "tax_regime";
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tax_regime_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tax_regime_id_taxRegimes_id_fk" FOREIGN KEY ("tax_regime_id") REFERENCES "public"."taxRegimes"("id") ON DELETE no action ON UPDATE no action;