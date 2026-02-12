DROP INDEX "idx_invoices_folio_fiscal";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_type" SET DATA TYPE varchar(25);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoices_org_folio_fiscal_unique" ON "invoices" USING btree ("organization_id","folio_fiscal");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoices_org_file_hash_unique" ON "invoices" USING btree ("organization_id","file_hash");