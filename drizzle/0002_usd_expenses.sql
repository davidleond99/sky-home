CREATE TYPE "public"."currency" AS ENUM('CUP', 'USD');--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "currency" "currency" DEFAULT 'CUP' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "rate" numeric(12, 2);--> statement-breakpoint
CREATE INDEX "expenses_currency_occurred_on_idx" ON "expenses" USING btree ("currency","occurred_on");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rate_matches_currency" CHECK (("expenses"."currency" = 'CUP' and "expenses"."rate" is null) or ("expenses"."currency" = 'USD' and "expenses"."rate" > 0));