ALTER TABLE "Payment"
  ADD COLUMN "gatewayAuthority" TEXT,
  ADD COLUMN "gatewayCardPan" TEXT;

CREATE UNIQUE INDEX "Payment_gatewayAuthority_key"
  ON "Payment"("gatewayAuthority");
