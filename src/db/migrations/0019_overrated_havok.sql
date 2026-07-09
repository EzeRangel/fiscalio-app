CREATE TABLE "tax_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"fiscal_period" varchar(7) NOT NULL,
	"adjustment_type" varchar(30) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN',
	"requires_compensation" boolean DEFAULT false,
	"applied_in_declaration_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "is_refund" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refunded_invoice_id" integer;--> statement-breakpoint
ALTER TABLE "tax_adjustments" ADD CONSTRAINT "tax_adjustments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_adjustments" ADD CONSTRAINT "tax_adjustments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_adjustments" ADD CONSTRAINT "tax_adjustments_applied_in_declaration_id_tax_declarations_id_fk" FOREIGN KEY ("applied_in_declaration_id") REFERENCES "public"."tax_declarations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tax_adjustments_org" ON "tax_adjustments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tax_adjustments_invoice" ON "tax_adjustments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_tax_adjustments_period" ON "tax_adjustments" USING btree ("fiscal_period");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_invoice_id_invoices_id_fk" FOREIGN KEY ("refunded_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;