CREATE TABLE "bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"account_name" varchar(100) NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"account_type" varchar(20),
	"currency" varchar(3) DEFAULT 'MXN',
	"initial_balance" numeric(15, 2) DEFAULT '0',
	"current_balance" numeric(15, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"partner_type" varchar(20) NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"tax_regime" varchar(10),
	"legal_name" varchar(255),
	"address" jsonb,
	"contact" jsonb,
	"payment_terms" integer,
	"credit_limit" numeric(15, 2),
	"tags" text[],
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"tax_regime" varchar(10) NOT NULL,
	"legal_name" varchar(255),
	"address" jsonb,
	"contact" jsonb,
	"logo_url" text,
	"fiscal_year_start" integer DEFAULT 1,
	"currency" varchar(3) DEFAULT 'MXN',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_rfc_unique" UNIQUE("rfc")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"partner_id" integer,
	"invoice_type" varchar(20) NOT NULL,
	"cfdi_type" varchar(10) NOT NULL,
	"cfdi_version" varchar(10) DEFAULT '4.0',
	"folio_fiscal" uuid,
	"internal_folio" varchar(50),
	"series" varchar(10),
	"invoice_date" timestamp NOT NULL,
	"certification_date" timestamp,
	"payment_due_date" date,
	"currency" varchar(3) DEFAULT 'MXN',
	"exchange_rate" numeric(10, 6) DEFAULT '1.0',
	"subtotal" numeric(15, 2) NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0',
	"total_taxes" numeric(15, 2) DEFAULT '0',
	"total_withholdings" numeric(15, 2) DEFAULT '0',
	"total" numeric(15, 2) NOT NULL,
	"payment_method" varchar(10),
	"payment_form" varchar(10),
	"payment_status" varchar(20) DEFAULT 'pending',
	"amount_paid" numeric(15, 2) DEFAULT '0',
	"tax_regime_issuer" varchar(10),
	"tax_regime_receiver" varchar(10),
	"cfdi_use" varchar(10),
	"xml_content" text,
	"pdf_url" text,
	"original_file_name" varchar(255),
	"file_hash" varchar(64),
	"processing_status" varchar(20) DEFAULT 'pending',
	"extraction_confidence" numeric(5, 4),
	"ai_classification" jsonb,
	"validation_errors" jsonb[],
	"accounting_period" varchar(7),
	"is_reconciled" boolean DEFAULT false,
	"reconciliation_date" timestamp,
	"status" varchar(20) DEFAULT 'active',
	"cancellation_reason" text,
	"cancellation_date" timestamp,
	"substitute_invoice_id" integer,
	"notes" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"product_service_key" varchar(10) NOT NULL,
	"identification_number" varchar(100),
	"description" text NOT NULL,
	"unit" varchar(10) NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"unit_price" numeric(15, 4) NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0',
	"subtotal" numeric(15, 2) NOT NULL,
	"account_code" varchar(20),
	"cost_center" varchar(50),
	"project_code" varchar(50),
	"department" varchar(50),
	"ai_suggested_account" varchar(20),
	"ai_confidence" numeric(5, 4),
	"is_manually_classified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_taxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"tax_type" varchar(20) NOT NULL,
	"tax_name" varchar(10) NOT NULL,
	"tax_code" varchar(10) NOT NULL,
	"rate" numeric(7, 6),
	"factor" varchar(10),
	"base_amount" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"partner_id" integer NOT NULL,
	"payment_type" varchar(20) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"payment_method" varchar(10) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN',
	"exchange_rate" numeric(10, 6) DEFAULT '1.0',
	"amount" numeric(15, 2) NOT NULL,
	"bank_account_id" integer,
	"reference_number" varchar(100),
	"authorization_number" varchar(100),
	"cfdi_payment_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount_allocated" numeric(15, 2) NOT NULL,
	"exchange_rate" numeric(10, 6) DEFAULT '1.0',
	"installment_number" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_partners" ADD CONSTRAINT "business_partners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partner_id_business_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."business_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_substitute_invoice_id_invoices_id_fk" FOREIGN KEY ("substitute_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_taxes" ADD CONSTRAINT "invoice_taxes_item_id_invoice_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."invoice_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_partner_id_business_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."business_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bank_accounts_org" ON "bank_accounts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_partners_org" ON "business_partners" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_partners_rfc" ON "business_partners" USING btree ("rfc");--> statement-breakpoint
CREATE INDEX "idx_organizations_rfc" ON "organizations" USING btree ("rfc");--> statement-breakpoint
CREATE INDEX "idx_invoices_org" ON "invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_partner" ON "invoices" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_folio_fiscal" ON "invoices" USING btree ("folio_fiscal");--> statement-breakpoint
CREATE INDEX "idx_items_invoice" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_items_account" ON "invoice_items" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX "idx_items_product_key" ON "invoice_items" USING btree ("product_service_key");--> statement-breakpoint
CREATE INDEX "idx_taxes_item" ON "invoice_taxes" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_payments_org" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_payments_partner" ON "payments" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_allocations_payment" ON "payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_allocations_invoice" ON "payment_allocations" USING btree ("invoice_id");