ALTER TABLE "invoices" ADD CONSTRAINT "amount_paid_limit" CHECK ("invoices"."amount_paid" <= "invoices"."total");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "amount_positive" CHECK ("payments"."amount" > 0);--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "amount_allocated_positive" CHECK ("payment_allocations"."amount_allocated" > 0);