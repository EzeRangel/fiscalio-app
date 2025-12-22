CREATE TABLE "chart_of_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_type" varchar(20) NOT NULL,
	"account_subtype" varchar(50),
	"parent_account_id" integer,
	"level" integer NOT NULL,
	"sat_code" varchar(20),
	"is_deductible" boolean DEFAULT false,
	"deduction_percentage" numeric(5, 2) DEFAULT '100.00',
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_id_account_code_unique" UNIQUE("organization_id","account_code")
);
--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_org_id" ON "chart_of_accounts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_code" ON "chart_of_accounts" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_type" ON "chart_of_accounts" USING btree ("account_type");