CREATE TABLE "classification_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"candidates" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "classification_snapshots" ADD CONSTRAINT "classification_snapshots_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_classification_snapshots_invoice" ON "classification_snapshots" USING btree ("invoice_id");