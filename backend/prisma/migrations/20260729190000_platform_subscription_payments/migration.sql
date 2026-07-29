ALTER TABLE "Payment"
  ADD COLUMN "tenantSubscriptionId" TEXT,
  ADD COLUMN "subscriptionPlanId" TEXT,
  ADD COLUMN "subscriptionMonths" INTEGER;

CREATE INDEX "Payment_tenantSubscriptionId_status_idx"
  ON "Payment"("tenantSubscriptionId", "status");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_tenantSubscriptionId_fkey"
  FOREIGN KEY ("tenantSubscriptionId")
  REFERENCES "TenantSubscription"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_subscriptionPlanId_fkey"
  FOREIGN KEY ("subscriptionPlanId")
  REFERENCES "SubscriptionPlan"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_subscriptionMonths_positive"
  CHECK ("subscriptionMonths" IS NULL OR "subscriptionMonths" IN (1, 3, 6, 12));
