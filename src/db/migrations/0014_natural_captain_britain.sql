CREATE TABLE "pattern_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"feature_set_hash" varchar(64) NOT NULL,
	"features" jsonb NOT NULL,
	"proposed_account_id" varchar(20) NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"consistency_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"confidence_score" numeric(5, 4) DEFAULT '0' NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'candidate' NOT NULL,
	CONSTRAINT "pattern_candidates_feature_set_hash_unique" UNIQUE("feature_set_hash")
);
--> statement-breakpoint
ALTER TABLE "pattern_candidates" ADD CONSTRAINT "pattern_candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pattern_candidates_hash" ON "pattern_candidates" USING btree ("feature_set_hash");--> statement-breakpoint
CREATE INDEX "idx_pattern_candidates_org_id" ON "pattern_candidates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pattern_candidates_status" ON "pattern_candidates" USING btree ("status");