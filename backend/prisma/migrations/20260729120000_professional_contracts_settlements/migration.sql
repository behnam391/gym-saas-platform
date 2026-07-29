CREATE TYPE "ProfessionalContractType" AS ENUM ('FIXED', 'REVENUE_SHARE', 'PER_CLIENT', 'HYBRID');
CREATE TYPE "ContractBillingCycle" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');
CREATE TYPE "ProfessionalContractStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ENDED');
CREATE TYPE "ProfessionalSettlementStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

CREATE TABLE "ProfessionalContract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "ProfessionalContractType" NOT NULL,
    "billingCycle" "ContractBillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "fixedAmount" DECIMAL(12,2),
    "sharePercent" DECIMAL(5,2),
    "perClientAmount" DECIMAL(12,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ProfessionalContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfessionalSettlement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "baseRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "clientCount" INTEGER NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "ProfessionalSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paymentRef" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalSettlement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfessionalContract_tenantId_status_idx" ON "ProfessionalContract"("tenantId", "status");
CREATE INDEX "ProfessionalContract_professionalId_status_idx" ON "ProfessionalContract"("professionalId", "status");
CREATE UNIQUE INDEX "ProfessionalSettlement_contractId_periodStart_periodEnd_key" ON "ProfessionalSettlement"("contractId", "periodStart", "periodEnd");
CREATE INDEX "ProfessionalSettlement_tenantId_status_periodEnd_idx" ON "ProfessionalSettlement"("tenantId", "status", "periodEnd");
CREATE INDEX "ProfessionalSettlement_contractId_createdAt_idx" ON "ProfessionalSettlement"("contractId", "createdAt");

ALTER TABLE "ProfessionalContract"
ADD CONSTRAINT "ProfessionalContract_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessionalContract"
ADD CONSTRAINT "ProfessionalContract_professionalId_fkey"
FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessionalContract"
ADD CONSTRAINT "ProfessionalContract_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProfessionalSettlement"
ADD CONSTRAINT "ProfessionalSettlement_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessionalSettlement"
ADD CONSTRAINT "ProfessionalSettlement_contractId_fkey"
FOREIGN KEY ("contractId") REFERENCES "ProfessionalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessionalSettlement"
ADD CONSTRAINT "ProfessionalSettlement_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProfessionalContract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProfessionalContract" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ProfessionalContract"
USING ("tenantId" = current_setting('app.tenant_id', true))
WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ProfessionalSettlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProfessionalSettlement" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ProfessionalSettlement"
USING ("tenantId" = current_setting('app.tenant_id', true))
WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
