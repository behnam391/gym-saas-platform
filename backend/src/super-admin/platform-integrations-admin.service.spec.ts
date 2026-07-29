import { PlatformIntegrationsAdminService } from './platform-integrations-admin.service';

describe('PlatformIntegrationsAdminService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('recognizes Kavenegar status 430 as a valid but limited trial account', async () => {
    const db = {
      platformIntegration: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sms-integration',
          key: 'SMS',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const config = {
      getSmsGatewayConfig: jest.fn().mockResolvedValue({
        apiKey: 'valid-trial-key',
        allowedRecipients: ['09120000000'],
        dryRun: false,
      }),
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        return: {
          status: 430,
          message: 'حساب کاربری احراز هویت نشده است',
        },
      }),
    } as unknown as Response);

    const service = new PlatformIntegrationsAdminService(
      { forPlatform: () => db } as never,
      config as never,
    );
    const result = await service.test('SMS', 'super-admin-id');

    expect(result).toEqual(
      expect.objectContaining({
        healthy: false,
        limited: true,
        message: expect.stringContaining('احراز هویت نشده'),
      }),
    );
    expect(db.platformIntegration.update).toHaveBeenCalledWith({
      where: { key: 'SMS' },
      data: {
        status: 'CONFIGURED',
        lastCheckedAt: expect.any(Date),
      },
    });
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'PLATFORM_INTEGRATION_TEST_LIMITED',
        metadata: { key: 'SMS', limited: true },
      }),
    });
  });
});
