CREATE TABLE "classification_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"rule_name" varchar(100) NOT NULL,
	"rule_type" varchar(20) NOT NULL,
	"match_criteria" jsonb NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"cost_center" varchar(50),
	"department" varchar(50),
	"tags" text[],
	"priority" integer DEFAULT 100,
	"confidence_boost" numeric(5, 4) DEFAULT '0.1',
	"times_applied" integer DEFAULT 0,
	"times_accepted" integer DEFAULT 0,
	"times_rejected" integer DEFAULT 0,
	"accuracy_rate" numeric(5, 4),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_classification_rules_org_id" ON "classification_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_classification_rules_type" ON "classification_rules" USING btree ("rule_type");