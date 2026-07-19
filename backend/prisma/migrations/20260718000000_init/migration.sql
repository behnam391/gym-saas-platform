-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'GYM_OWNER', 'TRAINER', 'NUTRITIONIST', 'RECEPTION', 'BUFFET_STAFF', 'ATHLETE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING_INSURANCE', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE_GATEWAY', 'CASH', 'POS', 'WALLET');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR_CODE', 'MEMBERSHIP_CARD', 'MANUAL');

-- CreateEnum
CREATE TYPE "FitnessGoal" AS ENUM ('FAT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'ENDURANCE', 'REHABILITATION');

-- CreateEnum
CREATE TYPE "TrainingLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE');

-- CreateEnum
CREATE TYPE "AISuggestionType" AS ENUM ('BODY_ANALYSIS', 'WORKOUT_DRAFT', 'NUTRITION_DRAFT', 'TRAINER_SUMMARY', 'NUTRITIONIST_SUMMARY', 'RISK_WARNING');

-- CreateEnum
CREATE TYPE "AISuggestionStatus" AS ENUM ('GENERATED', 'EDITED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TicketTargetType" AS ENUM ('GYM', 'TRAINER', 'NUTRITIONIST', 'PLATFORM');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CART', 'PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL', 'PUSH');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "workingHours" JSONB,
    "genderPolicy" "Gender",
    "phone" TEXT,
    "email" TEXT,
    "socialLinks" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantGalleryImage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantFacility" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "TenantFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "role" "Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "mobileVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentalConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianNationalId" TEXT NOT NULL,
    "guardianMobile" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentalConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "provider" TEXT,
    "policyNumber" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "status" "InsuranceStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "trainingHistory" TEXT,
    "injuries" TEXT,
    "illnesses" TEXT,
    "medications" TEXT,
    "allergies" TEXT,
    "fitnessGoal" "FitnessGoal",
    "trainingLevel" "TrainingLevel",
    "activityLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "armCm" DOUBLE PRECISION,
    "thighCm" DOUBLE PRECISION,
    "calfCm" DOUBLE PRECISION,
    "neckCm" DOUBLE PRECISION,
    "shoulderCm" DOUBLE PRECISION,
    "bodyFatPercent" DOUBLE PRECISION,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "type" "FitnessGoal" NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[],
    "certificateUrl" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "nationalIdDocUrl" TEXT NOT NULL,
    "certificateUrl" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerStudent" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainerStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionistClient" (
    "id" TEXT NOT NULL,
    "nutritionistId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NutritionistClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "type" "AISuggestionType" NOT NULL,
    "status" "AISuggestionStatus" NOT NULL DEFAULT 'GENERATED',
    "inputSnapshot" JSONB NOT NULL,
    "outputJson" JSONB NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" "FitnessGoal",
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceAISuggestionId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSession" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "ProgramSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramExercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" TEXT,
    "restSeconds" INTEGER,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgramExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nutritionistId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" "FitnessGoal",
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceAISuggestionId" TEXT,
    "dailyCalories" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietMeal" (
    "id" TEXT NOT NULL,
    "dietPlanId" TEXT NOT NULL,
    "mealTime" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "calories" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DietMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING_INSURANCE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT,
    "orderId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT,
    "method" "AttendanceMethod" NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "operatorId" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrowdSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "activeCount" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrowdSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CafeteriaProduct" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CafeteriaProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CART',
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "targetType" "TicketTargetType" NOT NULL,
    "targetId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetType" "TicketTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_city_idx" ON "Tenant"("city");

-- CreateIndex
CREATE INDEX "Tenant_isActive_isVerified_idx" ON "Tenant"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "TenantGalleryImage_tenantId_idx" ON "TenantGalleryImage"("tenantId");

-- CreateIndex
CREATE INDEX "TenantFacility_tenantId_idx" ON "TenantFacility"("tenantId");

-- CreateIndex
CREATE INDEX "MembershipPlan_tenantId_idx" ON "MembershipPlan"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex
CREATE INDEX "User_nationalId_idx" ON "User"("nationalId");

-- CreateIndex
CREATE INDEX "User_mobile_idx" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentalConsent_userId_key" ON "ParentalConsent"("userId");

-- CreateIndex
CREATE INDEX "InsuranceDocument_userId_status_idx" ON "InsuranceDocument"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");

-- CreateIndex
CREATE INDEX "BodyMeasurement_athleteId_recordedAt_idx" ON "BodyMeasurement"("athleteId", "recordedAt");

-- CreateIndex
CREATE INDEX "Goal_athleteId_idx" ON "Goal"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionistProfile_userId_key" ON "NutritionistProfile"("userId");

-- CreateIndex
CREATE INDEX "TrainerStudent_trainerId_idx" ON "TrainerStudent"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerStudent_trainerId_athleteId_key" ON "TrainerStudent"("trainerId", "athleteId");

-- CreateIndex
CREATE INDEX "NutritionistClient_nutritionistId_idx" ON "NutritionistClient"("nutritionistId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionistClient_nutritionistId_athleteId_key" ON "NutritionistClient"("nutritionistId", "athleteId");

-- CreateIndex
CREATE INDEX "AISuggestion_athleteId_type_idx" ON "AISuggestion"("athleteId", "type");

-- CreateIndex
CREATE INDEX "TrainingProgram_tenantId_idx" ON "TrainingProgram"("tenantId");

-- CreateIndex
CREATE INDEX "TrainingProgram_trainerId_idx" ON "TrainingProgram"("trainerId");

-- CreateIndex
CREATE INDEX "TrainingProgram_athleteId_idx" ON "TrainingProgram"("athleteId");

-- CreateIndex
CREATE INDEX "ProgramSession_programId_idx" ON "ProgramSession"("programId");

-- CreateIndex
CREATE INDEX "ProgramExercise_sessionId_idx" ON "ProgramExercise"("sessionId");

-- CreateIndex
CREATE INDEX "DietPlan_tenantId_idx" ON "DietPlan"("tenantId");

-- CreateIndex
CREATE INDEX "DietPlan_nutritionistId_idx" ON "DietPlan"("nutritionistId");

-- CreateIndex
CREATE INDEX "DietPlan_athleteId_idx" ON "DietPlan"("athleteId");

-- CreateIndex
CREATE INDEX "DietMeal_dietPlanId_idx" ON "DietMeal"("dietPlanId");

-- CreateIndex
CREATE INDEX "Membership_tenantId_userId_idx" ON "Membership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_userId_idx" ON "Payment"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Attendance_tenantId_userId_idx" ON "Attendance"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Attendance_tenantId_checkInAt_idx" ON "Attendance"("tenantId", "checkInAt");

-- CreateIndex
CREATE INDEX "CrowdSnapshot_tenantId_recordedAt_idx" ON "CrowdSnapshot"("tenantId", "recordedAt");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_idx" ON "ProductCategory"("tenantId");

-- CreateIndex
CREATE INDEX "CafeteriaProduct_tenantId_categoryId_idx" ON "CafeteriaProduct"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "Order_tenantId_userId_idx" ON "Order"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Ticket_tenantId_status_idx" ON "Ticket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- CreateIndex
CREATE INDEX "Review_tenantId_targetType_targetId_idx" ON "Review"("tenantId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Message_tenantId_conversationId_idx" ON "Message"("tenantId", "conversationId");

-- CreateIndex
CREATE INDEX "Message_recipientId_isRead_idx" ON "Message"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "TenantGalleryImage" ADD CONSTRAINT "TenantGalleryImage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFacility" ADD CONSTRAINT "TenantFacility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentalConsent" ADD CONSTRAINT "ParentalConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceDocument" ADD CONSTRAINT "InsuranceDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionistProfile" ADD CONSTRAINT "NutritionistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerStudent" ADD CONSTRAINT "TrainerStudent_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerStudent" ADD CONSTRAINT "TrainerStudent_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerStudent" ADD CONSTRAINT "TrainerStudent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionistClient" ADD CONSTRAINT "NutritionistClient_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "NutritionistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionistClient" ADD CONSTRAINT "NutritionistClient_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionistClient" ADD CONSTRAINT "NutritionistClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSession" ADD CONSTRAINT "ProgramSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "ProgramExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProgramSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "NutritionistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietMeal" ADD CONSTRAINT "DietMeal_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "DietPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrowdSnapshot" ADD CONSTRAINT "CrowdSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CafeteriaProduct" ADD CONSTRAINT "CafeteriaProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CafeteriaProduct" ADD CONSTRAINT "CafeteriaProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CafeteriaProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
