CREATE TABLE "classification_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"snapshot_id" integer,
	"selected_account_id" integer,
	"feedback_type" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "classification_feedback" ADD CONSTRAINT "classification_feedback_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classification_feedback" ADD CONSTRAINT "classification_feedback_snapshot_id_classification_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."classification_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classification_feedback" ADD CONSTRAINT "classification_feedback_selected_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("selected_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_classification_feedback_invoice" ON "classification_feedback" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_classification_feedback_snapshot" ON "classification_feedback" USING btree ("snapshot_id");