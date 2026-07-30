import { PlatformIntegrationsAdminService } from './platform-integrations-admin.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

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

  it('verifies SMTP credentials without sending an email', async () => {
    const db = {
      platformIntegration: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'email-integration',
          key: 'EMAIL_SMTP',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const config = {
      getEmailGatewayConfig: jest.fn().mockResolvedValue({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        username: 'mailer@example.com',
        password: 'app-password',
        fromAddress: 'no-reply@gordyar.ir',
        fromName: 'گُردیار',
        allowedRecipients: ['owner@example.com'],
        dryRun: true,
      }),
    };
    const verify = jest.fn().mockResolvedValue(true);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ verify });
    const service = new PlatformIntegrationsAdminService(
      { forPlatform: () => db } as never,
      config as never,
    );

    await expect(
      service.test('EMAIL_SMTP', 'super-admin-id'),
    ).resolves.toEqual(
      expect.objectContaining({ healthy: true, limited: false }),
    );
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      key: 'NESHAN_MAPS',
      response: { ok: true, json: { status: 'OK' } },
      expectedUrl: 'https://api.neshan.org/v5/reverse?lat=35.6892&lng=51.3890',
    },
    {
      key: 'GOOGLE_MAPS',
      response: { ok: true, json: { status: 'OK', results: [] } },
      expectedUrl: 'https://maps.googleapis.com/maps/api/geocode/json?',
    },
  ])('validates the $key server key with a real geocoding shape', async ({
    key,
    response,
    expectedUrl,
  }) => {
    const db = {
      platformIntegration: {
        findUnique: jest.fn().mockResolvedValue({
          id: `${key}-integration`,
          key,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const config = {
      getMapsGatewayConfig: jest.fn().mockResolvedValue({
        serverApiKey: 'valid-server-map-key',
      }),
    };
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: response.ok,
      json: jest.fn().mockResolvedValue(response.json),
    } as unknown as Response);
    const service = new PlatformIntegrationsAdminService(
      { forPlatform: () => db } as never,
      config as never,
    );

    await expect(
      service.test(key, 'super-admin-id'),
    ).resolves.toEqual(
      expect.objectContaining({ healthy: true, limited: false }),
    );
    expect(String(fetchSpy.mock.calls[0][0])).toContain(expectedUrl);
    expect(db.platformIntegration.update).toHaveBeenCalledWith({
      where: { key },
      data: { status: 'HEALTHY', lastCheckedAt: expect.any(Date) },
    });
  });
});
