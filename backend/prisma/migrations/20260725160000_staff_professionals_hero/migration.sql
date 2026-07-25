ALTER TABLE "NutritionistProfile"
ALTER COLUMN "nationalIdDocUrl" DROP NOT NULL,
ALTER COLUMN "certificateUrl" DROP NOT NULL;

CREATE TYPE "PlatformProfessionalType" AS ENUM ('TRAINER', 'NUTRITIONIST');
CREATE TYPE "ProfessionalServiceMode" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');
CREATE TYPE "ConsultationStatus" AS ENUM ('REQUESTED', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageCredit" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformProfessional" (
    "id" TEXT NOT NULL,
    "type" "PlatformProfessionalType" NOT NULL,
    "fullName" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "bio" TEXT,
    "specialties" TEXT[],
    "province" TEXT,
    "city" TEXT,
    "serviceMode" "ProfessionalServiceMode" NOT NULL DEFAULT 'ONLINE',
    "consultationFee" DECIMAL(12,2),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformProfessional_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3),
    "message" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HeroSlide_isActive_sortOrder_idx" ON "HeroSlide"("isActive", "sortOrder");
CREATE INDEX "PlatformProfessional_type_isActive_isFeatured_idx" ON "PlatformProfessional"("type", "isActive", "isFeatured");
CREATE INDEX "PlatformProfessional_province_city_idx" ON "PlatformProfessional"("province", "city");
CREATE INDEX "ConsultationRequest_athleteId_status_createdAt_idx" ON "ConsultationRequest"("athleteId", "status", "createdAt");
CREATE INDEX "ConsultationRequest_professionalId_status_createdAt_idx" ON "ConsultationRequest"("professionalId", "status", "createdAt");

ALTER TABLE "ConsultationRequest"
ADD CONSTRAINT "ConsultationRequest_professionalId_fkey"
FOREIGN KEY ("professionalId") REFERENCES "PlatformProfessional"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConsultationRequest"
ADD CONSTRAINT "ConsultationRequest_athleteId_fkey"
FOREIGN KEY ("athleteId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
