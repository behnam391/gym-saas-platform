import { KavenegarApi } from 'kavenegar';
import { PlatformIntegrationConfigService } from '../integrations/platform-integration-config.service';
import { NotificationProviderService } from './notification-provider.service';

jest.mock('kavenegar', () => ({
  KavenegarApi: jest.fn(),
}));

describe('NotificationProviderService Kavenegar SDK', () => {
  const Send = jest.fn();
  const VerifyLookup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (KavenegarApi as jest.Mock).mockReturnValue({ Send, VerifyLookup });
    Send.mockImplementation((_input, callback) => callback({}, 200, 'ok'));
    VerifyLookup.mockImplementation((_input, callback) =>
      callback({}, 200, 'ok'),
    );
  });

  function service(config: Record<string, unknown>) {
    const integrationConfig = {
      getSmsGatewayConfig: jest.fn().mockResolvedValue(config),
    } as unknown as PlatformIntegrationConfigService;
    return new NotificationProviderService(integrationConfig);
  }

  it('uses VerifyLookup and the approved template for OTP messages', async () => {
    const provider = service({
      apiKey: 'secret-api-key',
      otpTemplate: 'gordyarverify',
      allowedRecipients: ['09120000000'],
      dryRun: false,
    });

    await expect(
      provider.sendSms({
        to: '09120000000',
        text: 'fallback text',
        verification: { token: '123456' },
      }),
    ).resolves.toBe('SENT');

    expect(VerifyLookup).toHaveBeenCalledWith(
      {
        receptor: '09120000000',
        token: '123456',
        template: 'gordyarverify',
      },
      expect.any(Function),
    );
    expect(Send).not.toHaveBeenCalled();
  });

  it('falls back to the SDK Send method when no OTP template is configured', async () => {
    const provider = service({
      apiKey: 'secret-api-key',
      sender: '10004346',
      allowedRecipients: ['09120000000'],
      dryRun: false,
    });

    await provider.sendSms({
      to: '09120000000',
      text: 'پیام گُردیار',
      verification: { token: '123456' },
    });

    expect(Send).toHaveBeenCalledWith(
      {
        receptor: '09120000000',
        message: 'پیام گُردیار',
        sender: '10004346',
      },
      expect.any(Function),
    );
  });

  it('does not call Kavenegar while dry-run is enabled', async () => {
    const provider = service({
      apiKey: 'secret-api-key',
      allowedRecipients: ['09120000000'],
      dryRun: true,
    });

    await expect(
      provider.sendSms({ to: '09120000000', text: 'test' }),
    ).resolves.toBe('DRY_RUN');
    expect(KavenegarApi).not.toHaveBeenCalled();
  });
});
