CREATE TABLE "declaration_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"applied_account_code" varchar(20),
	"applied_account_name" varchar(255),
	"is_deductible" boolean DEFAULT false,
	"deduction_percentage" numeric(5, 2) DEFAULT '100.00',
	"included_amount" numeric(15, 2) NOT NULL,
	"deductible_amount" numeric(15, 2) DEFAULT '0',
	"iva_amount" numeric(15, 2) DEFAULT '0',
	"iva_type" varchar(20),
	"was_manually_adjusted" boolean DEFAULT false,
	"adjustment_reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_invoice_declaration" UNIQUE("declaration_id","invoice_id")
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"period" varchar(7) NOT NULL,
	"status" varchar(20) DEFAULT 'open',
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tax_declarations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"fiscal_period" varchar(7) NOT NULL,
	"declaration_type" varchar(30) NOT NULL,
	"tax_regime" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"total_income" numeric(15, 2) NOT NULL,
	"total_expenses" numeric(15, 2) NOT NULL,
	"deductible_expenses" numeric(15, 2) NOT NULL,
	"iva_charged" numeric(15, 2) DEFAULT '0',
	"iva_creditable" numeric(15, 2) DEFAULT '0',
	"iva_balance" numeric(15, 2) DEFAULT '0',
	"isr_base" numeric(15, 2) DEFAULT '0',
	"isr_rate" numeric(5, 4),
	"isr_calculated" numeric(15, 2) DEFAULT '0',
	"isr_withheld" numeric(15, 2) DEFAULT '0',
	"isr_provisional" numeric(15, 2) DEFAULT '0',
	"isr_balance" numeric(15, 2) DEFAULT '0',
	"calculation_details" jsonb,
	"ai_validations" jsonb,
	"export_format" varchar(20),
	"exported_file" text,
	"exported_at" timestamp,
	"filed_at" timestamp,
	"acknowledgment_number" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_org_period" UNIQUE("organization_id","fiscal_period","declaration_type")
);
--> statement-breakpoint
ALTER TABLE "declaration_invoices" ADD CONSTRAINT "declaration_invoices_declaration_id_tax_declarations_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."tax_declarations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_invoices" ADD CONSTRAINT "declaration_invoices_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_declarations" ADD CONSTRAINT "tax_declarations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_declaration_invoices_declaration" ON "declaration_invoices" USING btree ("declaration_id");--> statement-breakpoint
CREATE INDEX "idx_declaration_invoices_invoice" ON "declaration_invoices" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_tax_declarations_org" ON "tax_declarations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tax_declarations_period" ON "tax_declarations" USING btree ("fiscal_period");--> statement-breakpoint
CREATE INDEX "idx_tax_declarations_status" ON "tax_declarations" USING btree ("status");