-- Platform support requests can be created before an athlete joins a gym.
ALTER TABLE "Ticket" ALTER COLUMN "tenantId" DROP NOT NULL;
