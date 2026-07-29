CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'EMAIL');
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'ONBOARDING', 'RESET_PASSWORD', 'LOGIN');

CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "destination" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpChallenge_destination_purpose_createdAt_idx"
ON "OtpChallenge"("destination", "purpose", "createdAt");

CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");
