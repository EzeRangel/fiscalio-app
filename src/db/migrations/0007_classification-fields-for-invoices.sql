ALTER TABLE "invoices" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cost_center" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "department" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "classification_source" varchar(20) DEFAULT 'ai';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "classification_confidence" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;