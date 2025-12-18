ALTER TABLE "business_partners" ADD COLUMN "tax_regime_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "business_partners" ADD CONSTRAINT "business_partners_tax_regime_id_taxRegimes_id_fk" FOREIGN KEY ("tax_regime_id") REFERENCES "public"."taxRegimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_partners" DROP COLUMN "tax_regime";