import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AiEngineService } from '../ai-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiProviderService } from '../ai-provider.service';

function makeService(tx: any) {
  const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
  const aiProvider = {} as AiProviderService;
  return new AiEngineService(prisma, aiProvider);
}

describe('AiEngineService.review', () => {
  it('throws NotFoundException when the suggestion does not exist', async () => {
    const tx = { aiSuggestion: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = makeService(tx);
    await expect(
      service.review('missing', 'reviewer-1', 'TRAINER', { status: 'APPROVED' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a TRAINER trying to approve a NUTRITION_DRAFT — outside their professional domain', async () => {
    const tx = {
      aiSuggestion: {
        findUnique: jest.fn().mockResolvedValue({ id: 's1', type: 'NUTRITION_DRAFT' }),
      },
    };
    const service = makeService(tx);
    await expect(
      service.review('s1', 'trainer-1', 'TRAINER', { status: 'APPROVED' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects a NUTRITIONIST trying to approve a WORKOUT_DRAFT — outside their professional domain', async () => {
    const tx = {
      aiSuggestion: {
        findUnique: jest.fn().mockResolvedValue({ id: 's2', type: 'WORKOUT_DRAFT' }),
      },
    };
    const service = makeService(tx);
    await expect(
      service.review('s2', 'nutritionist-1', 'NUTRITIONIST', { status: 'APPROVED' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a TRAINER to approve a WORKOUT_DRAFT in their own domain', async () => {
    const tx = {
      aiSuggestion: {
        findUnique: jest.fn().mockResolvedValue({ id: 's3', type: 'WORKOUT_DRAFT', outputJson: {} }),
        update: jest.fn().mockResolvedValue({ id: 's3', status: 'APPROVED' }),
      },
    };
    const service = makeService(tx);
    const result = await service.review('s3', 'trainer-1', 'TRAINER', { status: 'APPROVED' });
    expect(result.status).toBe('APPROVED');
    expect(tx.aiSuggestion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED', reviewedById: 'trainer-1' }),
      }),
    );
  });
});
