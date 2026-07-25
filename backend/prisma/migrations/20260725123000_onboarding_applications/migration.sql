CREATE TYPE "OnboardingApplicationType" AS ENUM ('GYM_OWNER', 'TRAINER', 'NUTRITIONIST');
CREATE TYPE "OnboardingApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "OnboardingApplication" (
    "id" TEXT NOT NULL,
    "type" "OnboardingApplicationType" NOT NULL,
    "status" "OnboardingApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "province" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "gymName" TEXT,
    "specialty" TEXT,
    "licenseNumber" TEXT,
    "notes" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OnboardingApplication_type_status_createdAt_idx"
ON "OnboardingApplication"("type", "status", "createdAt");

CREATE INDEX "OnboardingApplication_mobile_type_idx"
ON "OnboardingApplication"("mobile", "type");
