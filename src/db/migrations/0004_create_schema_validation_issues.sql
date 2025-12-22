CREATE TABLE "validation_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"issue_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"field_name" varchar(100),
	"description" text NOT NULL,
	"suggested_fix" text,
	"auto_fixable" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'open',
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_validation_issues_invoice_id" ON "validation_issues" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_validation_issues_type" ON "validation_issues" USING btree ("issue_type");