CREATE UNIQUE INDEX "ProfessionalContract_one_active_per_professional_key"
ON "ProfessionalContract"("professionalId") WHERE "status" = 'ACTIVE';
